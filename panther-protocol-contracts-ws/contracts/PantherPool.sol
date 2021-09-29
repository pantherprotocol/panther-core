// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { PoseidonT4 } from "./Poseidon.sol";
import "./CommitmentsTrees.sol";
import "./verifier/Verifier.sol";
import { IN_UTXOs, MAX_EXT_AMOUNT, MAX_TIMESTAMP, OUT_UTXOs } from "./Constants.sol";
import { PluginData, SnarkProof } from "./Types.sol";
import "./ErrorMsgs.sol";

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

    address public constant rewardToken = 3333;

    struct Period {
        uint256 from;
        uint256 to;
    }

    struct ExtPay {
        address account;
        uint256 amount;
    }

    struct Rewards {
        uint24 forTx;
        uint24 forUtxo;
        uint24 forDeposit;
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

    // constructor: require(BATCH_SIZE == OUT_UTXOs)

    /* TODO: remove these in-line dev notes
        // recipient generates
        spendRootPrivKey: = fn(seed)
        readPrivKey: = fn(seed)
        // recipient calculates and emits, sender reads
        spendRootPubKey := BabyPubKey(spendRootPrivKey)
        readPubKey: = BabyPubKey(readPrivKey)

        // for output UTXOs, sender generates
        random
        // for output UTXOs, smart contract encrypts emits
        encodedMessage := fn((token, amount, random), readPubKey)
        // for output UTXOs, sender calculates
        spendPubKey := spendRootPubKey + BabyPubKey(random)
        // for output UTXOs, circuit verifies
        !!! REMOVED: spendPubKey := spendRootPubKey + BabyPubKey(random)
        Leaf := Poseidon(spendPubKey.Ax, spendPubKey.Ay, value, token, timestamp)

        // for input UTXOs, recipient reads and decrypts
        (token, amount, random) = decrypt(encodedMessage, readPrivKey)
        // for input UTXOs, recipient calculates
        spendPrivKey := spendRootPrivKey + random
        // for input UTXOs, circuit verifies
        spendPubKey := BabyPubKey(spendPrivKey)
        Nullifier := Poseidon(spendPrivKey, leafId)
    */

    function transaction(
        Period timeLimit,
        address feeToken, // ignored in zk-proof
        address feePayer, //  ignored in zk-proof
        address token, // for deposit ar withdrawal
        ExtPay calldata deposit,
        ExtPay calldata withdrawal,
        PluginData calldata plugin,
        // "Input" zAsset UTXOs to spend
        bytes32[IN_UTXOs] calldata inputMerkleRoots,
        bytes32[IN_UTXOs] calldata inputNullifiers,
        // Commitments to "output" UTXOs - both zAssets and PRP (reward points)
        uint256[OUT_UTXOs] calldata commitments,
        uint256[UTXO_SECRETS][OUT_UTXOs] calldata secrets,
        SnarkProof calldata proof
    ) external payable {
        // FIXME: add Non-reentrant
        {
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

        if (deposit.amount == 0 && withdrawal.amount == 0) {
            require(token == address(0), ERR_ZERO_TOKEN_EXPECTED);
        } else {
            require(token == address(0), ERR_ZERO_TOKEN_UNEXPECTED);

            uint256 feeAmount;
            Fees memory rates = feeRates;
            if (deposit.amount != 0) {
                require(
                    deposit.amount < MAX_EXT_AMOUNT,
                    ERR_DEPOSIT_OVER_LIMIT
                );
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
                IERC20(token).safeTransfer(
                    withdrawal.amount,
                    withdrawal.account
                );
            }
            if (feeAmount != 0) {
                processFees(feeToken, feePayer, feeAmount);
            }
        }

        require(
            inputNullifiers.length == inputMerkleRoots.length,
            ERR_INVALID_JOIN_INPUT
        );
        for (uint256 i = 0; i < inputNullifiers.length; i++) {
            uint256 nullifier = inputNullifiers[i];
            require(nullifier < FIELD_SIZE, ERR_TOO_LARGE_NULLIFIER);
            require(!isSpent[nullifier], ERR_SPENT_NULLIFIER);

            require(isKnownRoot(inputMerkleRoots[i]), ERR_UNKNOWN_MERKLE_ROOT);

            isSpent[nullifier] = true;
            emit Nullifier(nullifier);
        }

        uint256 extraInputsHash = uint256(
            keccak256(
                abi.encodePacked(
                    // Input params which are not used in arithmetic circuits
                    deposit.account,
                    withdrawal.account,
                    plugin,
                    secrets
                )
            )
        ) % FIELD_SIZE;

        uint256 inputsHash;
        {
            Rewards memory rewards = rewardRates;
            inputsHash =
                uint256(
                    sha256(
                        abi.encodePacked(
                            uint256(token),
                            deposit.amount,
                            withdrawal.amount,
                            uint256(rewardToken),
                            uint256(rewards.forTx),
                            uint256(rewards.forUtxo),
                            uint256(rewards.forDeposit),
                            extraInputsHash,
                            timeLimit.from,
                            timeLimit.to,
                            // TODO: check if `bytes32[..]` to be converted to `uint256, uint256, ...`
                            inputMerkleRoots,
                            inputNullifiers,
                            // TODO: check if `uint256[..]` to be converted to `uint256, uint256, ...`
                            commitments
                        )
                    )
                ) %
                FIELD_SIZE;
        }
        require(verify(proof, inputsHash), ERR_INVALID_PROOF);

        addAndEmitCommitments(commitments, secrets, timeLimit.to);

        if (plugin.contractAddress != bytes32(0)) {
            require(
                callPlugin(plugin.contractAddress, plugin.callData),
                ERR_PLUGIN_FAILURE
            );
        }
    }

    function processFees(
        address feeToken,
        address feePayer,
        uint256 feeAmount
    ) internal {
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

    function callPlugin(address pluginAddress, bytes calldata callData)
        internal
        returns (bool success)
    {
        // TODO: implement plugin call
        success = true;
    }
}
