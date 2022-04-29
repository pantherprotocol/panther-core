// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { PoseidonT4 } from "./crypto/Poseidon.sol";
import "./pantherPool/CommitmentsTrees.sol";
import "./verifier/Verifier.sol";
import { IN_UTXOs, MAX_EXT_AMOUNT, MAX_TIMESTAMP, OUT_UTXOs } from "./common/Constants.sol";
uint256 constant NUM_PACKED_BYTES32_PROOF_INPUTS = IN_UTXOs * 2 + OUT_UTXOs;
uint256 constant NUM_PACKED_UINT256_PROOF_INPUTS = 5;
uint256 constant NUM_PACKED_ADDRESS_PROOF_INPUTS = 4;
import { PluginData, SnarkProof } from "./common/Types.sol";
import "./common/ErrorMsgs.sol";

/**
 * @title PantherPool
 * @author Pantherprotocol Contributors
 * @notice Shielded Pool main contract
 */
contract PantherPool is CommitmentsTrees, Verifier {
    using SafeERC20 for IERC20;

    // This version yet:
    // - accepts ERC-20 tokens but not the native coin (ETH)
    // - ignores bridging/messaging to pier-chains
    //   -- referencing assets, ignores pier-chains assets originate from
    // - does not separate (and implements) functionality of the 'Vault' contract
    // - is not yet upgradable (no initializer(s), no support for UUPS Proxies)
    // - does not implement the "collecting" tx (with 8 input UTXOs)
    // These issues will be addressed later

    // Use fake address for now, just to get contracts compiling
    address public constant rewardToken =
        0x21479eB8CB1a27861c902F07A952b72b10Fd53EF;

    struct Period {
        uint256 from;
        uint256 to;
    }

    struct ExtPay {
        address account;
        uint256 amount;
    }

    struct Rewards {
        uint24 forTxReward;
        uint24 forUtxoReward;
        uint24 forDepositReward;
    }

    struct Fees {
        uint128 deposit;
        uint128 withdrawal;
    }

    // @notice Seen (i.e. spent) commitment nullifiers
    // nullifier hash => spent
    mapping(bytes32 => bool) public isSpent;

    Rewards public rewardRates;
    uint256 public tokenWeightsRoot;

    // @notice Protocol fees (in $ZKP token units)
    Fees public feeRates;

    event RewardRates(
        uint256 forTxReward,
        uint256 forUtxoReward,
        uint256 forDepositReward
    );

    event TokenWeightsRoot(uint256 root);

    event FeeRates(uint256 deposit, uint256 withdrawal);

    event Nullifier(bytes32 nullifier);

    // constructor: require(TRIAD_SIZE == OUT_UTXOs)

    function checkValidTimeLimits(Period calldata timeLimit) internal view {
        uint256 currentTime = block.timestamp;
        require(
            timeLimit.from >= currentTime && timeLimit.to <= currentTime,
            ERR_EXPIRED_TX_TIME
        );
        require(
            timeLimit.from < MAX_TIMESTAMP && timeLimit.to < MAX_TIMESTAMP,
            ERR_TOO_LARGE_TIME
        );
    }

    function processDepositWithdraw(
        address, // feeToken, // ignored in zk-proof
        address feePayer, //  ignored in zk-proof
        address token, // for deposit ar withdrawal
        ExtPay calldata deposit,
        ExtPay calldata withdrawal
    ) internal {
        uint256 feeAmount;
        Fees memory rates = feeRates;
        if (deposit.amount != 0) {
            require(deposit.amount < MAX_EXT_AMOUNT, ERR_DEPOSIT_OVER_LIMIT);
            require(
                deposit.account != address(0),
                ERR_DEPOSIT_FROM_ZERO_ADDRESS
            );
            feeAmount += rates.deposit;
            IERC20(token).safeTransferFrom(
                deposit.account,
                address(this),
                deposit.amount
            );
        }
        if (withdrawal.amount != 0) {
            require(
                withdrawal.amount < MAX_EXT_AMOUNT,
                ERR_WITHDRAW_OVER_LIMIT
            );
            require(
                withdrawal.account != address(0),
                ERR_WITHDRAW_TO_ZERO_ADDRESS
            );
            feeAmount += rates.withdrawal;
            IERC20(token).safeTransfer(withdrawal.account, withdrawal.amount);
        }
        if (feeAmount != 0) {
            processFees(
                // feeToken,
                feePayer,
                feeAmount
            );
        }
    }

    function processNullifiers(
        uint256[IN_UTXOs] calldata inputTreeIds,
        bytes32[IN_UTXOs] calldata inputMerkleRoots,
        bytes32[IN_UTXOs] calldata inputNullifiers
    ) internal {
        for (uint256 i = 0; i < inputNullifiers.length; i++) {
            bytes32 nullifier = inputNullifiers[i];
            require(uint256(nullifier) < FIELD_SIZE, ERR_TOO_LARGE_NULLIFIER);
            require(!isSpent[nullifier], ERR_SPENT_NULLIFIER);

            require(
                // TODO: add cache index hints
                isKnownRoot(inputTreeIds[i], inputMerkleRoots[i], 0),
                ERR_UNKNOWN_MERKLE_ROOT
            );

            isSpent[nullifier] = true;
            emit Nullifier(nullifier);
        }
    }

    /* TODO: remove these in-line dev notes
       Recipient reading key V = vB
       Recipient master spending key S = sB

       Sender's ephemeral key  R = rB
       Sender derives a shared key K=ECDH(V, r)  = rV = rvB
       Sender derives new spending key for recipient as S' = rS
       Sender uses K to encrypt the tx opening values M= (r, amount, token, ...)
       Ciphertext C = Enc(M, K).
       The sender publishes R and C

       The recipient derives shared key K = vR= vrB
       The recipient decrypts ciphertext M = Dec(C, K)

        // recipient generates
        spendRootPrivKey: = fn(seed)
        readPrivKey: = fn(seed)
        spendRootPubKey := BabyPubKey(spendRootPrivKey)
        readPubKey: = BabyPubKey(readPrivKey)
        // recipient emits, sender reads
        spendRootPubKey, readPubKey

        // for output UTXOs, sender generates
        random
        encodedMessage := fn((token, amount, random), readPubKey)
        spendPubKey := fn(spendRootPubKey,random)
        // for output UTXOs, circuit verifies
        spendPubKey := BabyPubKey(spendPrivKey)
        Leaf := Poseidon(spendPubKey.Ax, spendPubKey.Ay, amount, token, createTime)
        // for output UTXOs, smart contract emits
        encodedMessage, leafId, createTime

        // for new UTXOs, recipient reads and decrypts
        - 1x (1 or 1/8) words - leftLeafId
        - 1x (1 or 1/8) words - createTime
        - (3 or 2)x (2 or 1) words - Sender's ephemeral key  R
        - (3 or 2)x (1 or 1/2) words - iv
        - (3 or 2)x (2 or 3) words - (token, amount, random) = decrypt(encodedMessage, readPrivKey)
        // to spend UTXOs, recipient calculates
        spendPrivKey := fn(random, spendRootPrivKey)
        // for input UTXOs, circuit verifies
        spendPubKey := BabyPubKey(spendPrivKey)
        Nullifier := Poseidon(spendPrivKey, leafId)
        .. and tokenWeightLeaf
    */

    function getExtraInputsHash(
        address deposit,
        address withdrawal,
        PluginData memory plugin,
        uint256[UTXO_SECRETS_T0][OUT_UTXOs] memory secrets
    ) internal pure returns (uint256) {
        return
            uint256(
                keccak256(
                    abi.encodePacked(
                        // Input params which are not used in arithmetic circuits
                        deposit,
                        withdrawal,
                        plugin.contractAddress,
                        plugin.callData,
                        secrets
                    )
                )
            ) % FIELD_SIZE;
    }

    function packBytes32ProofInputs(
        bytes32[IN_UTXOs] calldata inputMerkleRoots,
        bytes32[IN_UTXOs] calldata inputNullifiers,
        bytes32[OUT_UTXOs] calldata commitments
    ) internal pure returns (bytes32[NUM_PACKED_BYTES32_PROOF_INPUTS] memory) {
        bytes32[NUM_PACKED_BYTES32_PROOF_INPUTS] memory packed;
        for (uint256 i = 0; i < IN_UTXOs; i++) {
            packed[i] = inputMerkleRoots[i];
            packed[i + IN_UTXOs] = inputNullifiers[i];
        }
        for (uint256 i = 0; i < IN_UTXOs; i++) {
            packed[i + 2 * IN_UTXOs] = commitments[i];
        }
        return packed;
    }

    function packUint256ProofInputs(Period memory timeLimit)
        internal
        view
        returns (uint256[NUM_PACKED_UINT256_PROOF_INPUTS] memory)
    {
        uint256[NUM_PACKED_UINT256_PROOF_INPUTS] memory packed;
        packed[0] = timeLimit.from;
        packed[1] = timeLimit.to;
        packed[2] = uint256(rewardRates.forTxReward);
        packed[3] = uint256(rewardRates.forUtxoReward);
        packed[4] = uint256(rewardRates.forDepositReward);
        return packed;
    }

    function packAddressProofInputs(
        address token,
        address deposit,
        address withdrawal,
        address plugin
    ) internal pure returns (address[NUM_PACKED_ADDRESS_PROOF_INPUTS] memory) {
        address[NUM_PACKED_ADDRESS_PROOF_INPUTS] memory packed;
        packed[0] = token;
        packed[1] = deposit;
        packed[2] = withdrawal;
        packed[3] = plugin;
        return packed;
    }

    function verifyTransactionProof(
        PluginData memory plugin,
        // "Input" zAsset UTXOs to spend
        bytes32[NUM_PACKED_BYTES32_PROOF_INPUTS] memory bytes32ProofInputs,
        uint256[NUM_PACKED_UINT256_PROOF_INPUTS] memory uint256ProofInputs,
        address[NUM_PACKED_ADDRESS_PROOF_INPUTS] memory addressProofInputs,
        uint256[UTXO_SECRETS_T0][OUT_UTXOs] memory secrets,
        SnarkProof calldata proof
    ) internal pure {
        uint256 extraInputsHash = getExtraInputsHash(
            addressProofInputs[1],
            addressProofInputs[2],
            plugin,
            secrets
        );

        uint256 inputsHash = uint256(
            sha256(
                abi.encodePacked(
                    rewardToken,
                    bytes32ProofInputs,
                    uint256ProofInputs,
                    addressProofInputs,
                    extraInputsHash
                )
            )
        ) % FIELD_SIZE;
        bool validProof = verifyProof(proof, inputsHash);
        require(validProof, ERR_INVALID_PROOF);
    }

    function transaction(
        Period calldata timeLimit,
        address feeToken, // ignored in zk-proof
        address feePayer, //  ignored in zk-proof
        address token, // for deposit or withdrawal
        ExtPay calldata deposit,
        ExtPay calldata withdrawal,
        PluginData calldata plugin,
        // "Input" zAsset UTXOs to spend
        bytes32[IN_UTXOs] calldata inputMerkleRoots,
        bytes32[IN_UTXOs] calldata inputNullifiers,
        // Commitments to "output" UTXOs - both zAssets and PRP (reward points)
        bytes32[OUT_UTXOs] calldata commitments,
        uint256[UTXO_SECRETS_T0][OUT_UTXOs] calldata secrets,
        SnarkProof calldata proof
    ) external payable {
        checkValidTimeLimits(timeLimit);
        // FIXME: add Non-reentrant

        if (deposit.amount == 0 && withdrawal.amount == 0) {
            require(token == address(0), ERR_ZERO_TOKEN_EXPECTED);
        } else {
            require(token == address(0), ERR_ZERO_TOKEN_UNEXPECTED);

            processDepositWithdraw(
                feeToken,
                feePayer,
                token,
                deposit,
                withdrawal
            );
        }

        require(
            inputNullifiers.length == inputMerkleRoots.length,
            ERR_INVALID_JOIN_INPUT
        );

        // processNullifiers(inputTreeIds, inputMerkleRoots, inputNullifiers);

        // Horrible hack to avoid "Stack too deep" errors
        {
            bytes32[NUM_PACKED_BYTES32_PROOF_INPUTS]
                memory bytes32ProofInputs = packBytes32ProofInputs(
                    inputMerkleRoots,
                    inputNullifiers,
                    commitments
                );

            uint256[NUM_PACKED_UINT256_PROOF_INPUTS]
                memory uint256ProofInputs = packUint256ProofInputs(timeLimit);

            address[NUM_PACKED_ADDRESS_PROOF_INPUTS]
                memory addressProofInputs = packAddressProofInputs(
                    token,
                    deposit.account,
                    withdrawal.account,
                    plugin.contractAddress
                );

            verifyTransactionProof(
                plugin,
                bytes32ProofInputs,
                uint256ProofInputs,
                addressProofInputs,
                secrets,
                proof
            );
        }

        addAndEmitCommitments(commitments, secrets, timeLimit.to);

        if (plugin.contractAddress != address(0)) {
            require(callPlugin(plugin), ERR_PLUGIN_FAILURE);
        }
    }

    function processFees(
        // address feeToken,
        address feePayer,
        uint256 // feeAmount
    ) internal pure {
        // TODO: check if `require` is not doubled by the code called
        require(feePayer != address(0), ERR_ZERO_FEE_PAYER);
        require(feePayer != address(0), ERR_ZERO_FEE_PAYER);
        // TODO: implement processFees
    }

    function updateRewardRates(Rewards calldata rates) external {
        // FIXME: add onlyOwner
        rewardRates = rates;
        emit RewardRates(
            rates.forTxReward,
            rates.forUtxoReward,
            rates.forDepositReward
        );
    }

    function updateProtocolFees(Fees calldata rates) external {
        // FIXME: add onlyOwner
        feeRates = rates;
        emit FeeRates(rates.deposit, rates.withdrawal);
    }

    function updateTokenWeightsRoot(uint256 newRoot) external {
        // FIXME: add onlyOwner
        require(newRoot < FIELD_SIZE, ERR_TOO_LARGE_ROOT);
        tokenWeightsRoot = newRoot;
        emit TokenWeightsRoot(newRoot);
    }

    function callPlugin(
        PluginData memory // plugin
    ) internal pure returns (bool success) {
        // TODO: implement plugin call
        success = true;
        return success;
    }
}
