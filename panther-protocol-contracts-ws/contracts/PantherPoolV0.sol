// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./common/Constants.sol";
import "./common/ErrorMsgs.sol";
import "./common/ImmutableOwnable.sol";
import "./common/NonReentrant.sol";
import "./common/Types.sol";
import "./interfaces/IVault.sol";
import "./common/Claimable.sol";
import "./pantherPool/CommitmentGenerator.sol";
import "./pantherPool/CommitmentsTrees.sol";
import "./pantherPool/PrpGrantor.sol";
import "./pantherPool/ZAssetsRegistry.sol";
import "./pantherPool/v0/MerkleProofVerifier.sol";
import "./pantherPool/v0/NullifierGenerator.sol";
import "./pantherPool/v0/PubKeyGenerator.sol";

/**
 * @title PantherPool
 * @author Pantherprotocol Contributors
 * @notice Shielded Pool main contract v0
 * @dev It is the "version 0" of the Panther Protocol Multi-Asset Shielded Pool ("MASP").
 * It locks assets and generates UTXO's in the MASP (i.e. builds commitment trees), but
 * it does not implement the functionality for spending these UTXOs.
 * This contract is supposed to be upgraded with the new one, which is the MASP "v.1".
 * The "v.1" is supposed to implement the spending and lets holders spend their UTXOs.
 * To be upgradable, this contract is assumed to run as an "implementation" for a proxy
 * that DELEGATECALL's the implementation.
 * To protect holders against lost of assets in case this contract is not upgraded, it
 * implements the "early exit", through which holders may withdraw their locked assets.
 */
contract PantherPoolV0 is
    ImmutableOwnable,
    NonReentrant,
    Claimable,
    CommitmentsTrees,
    ZAssetsRegistry,
    PrpGrantor,
    CommitmentGenerator,
    MerkleProofVerifier,
    NullifierGenerator,
    PubKeyGenerator
{
    // NOTE: The contract is supposed to run behind a proxy DELEGATECALLing it.
    // For compatibility on upgrades, decrease `__gap` if new variables added.
    uint256[50] private __gap;

    // solhint-disable var-name-mixedcase
    uint256 public immutable EXIT_TIME;
    address public immutable VAULT;
    // solhint-enable var-name-mixedcase

    // @notice Seen (i.e. spent) commitment nullifiers
    // nullifier hash => spent
    mapping(bytes32 => bool) public isSpent;

    event Nullifier(bytes32 nullifier);

    constructor(
        address _owner,
        uint256 exitTime,
        address vault
    ) ImmutableOwnable(_owner) {
        require(TRIAD_SIZE == OUT_UTXOs, "E0");
        require(exitTime > timeNow() && exitTime < MAX_TIMESTAMP, "E1");
        revertZeroAddress(vault);

        // As it runs behind the DELEGATECALL'ing proxy, initialization of
        // immutable "vars" only is allowed in the constructor
        EXIT_TIME = exitTime;
        VAULT = vault;
    }

    /// @notice Transfer assets from the msg.sender to the VAULT and generate UTXOs in the MASP
    /// @param tokens Address of the token contract for every UTXO
    /// @dev For PRP granted the address ot this contract (proxy) is supposed to be used
    /// @param tokenIds For ERC-721 and ERC-1155 - token ID or subId of the token, 0 for ERC-20
    /// @param extAmounts Token amounts (external) to be deposited
    /// @param pubSpendingKeys Public Spending Key for every UTXO
    /// @param secrets Encrypted opening values for every UTXO
    /// @param  createdAt Optional, if 0 network time used
    /// @dev createdAt must be less (or equal) the network time
    function generateDeposits(
        address[OUT_UTXOs] calldata tokens,
        uint256[OUT_UTXOs] calldata tokenIds,
        uint256[OUT_UTXOs] calldata extAmounts,
        G1Point[OUT_UTXOs] calldata pubSpendingKeys,
        uint256[CIPHERTEXT1_WORDS][OUT_UTXOs] calldata secrets,
        uint256 createdAt
    ) external nonReentrant {
        uint256 timestamp = timeNow();
        if (createdAt != 0) {
            require(createdAt <= timestamp, ERR_TOO_EARLY_CREATED_AT);
            timestamp = createdAt;
        }

        bytes32[OUT_UTXOs] memory commitments;
        uint256[UTXO_SECRETS][OUT_UTXOs] memory secretMsgs;
        for (uint256 utxoIndex = 0; utxoIndex < OUT_UTXOs; utxoIndex++) {
            (ZAsset memory asset, uint160 zAssetId) = getZAssetAndId(
                tokens[utxoIndex],
                tokenIds[utxoIndex]
            );
            require(asset.status == zASSET_ENABLED, ERR_WRONG_ASSET);

            uint96 scaledAmount = 0;
            if (extAmounts[utxoIndex] != 0) {
                if (asset.tokenType == PRP_TOKEN_TYPE)
                    useGrant(msg.sender, extAmounts[utxoIndex]);
                else
                    IVault(VAULT).lockAsset(
                        LockData(
                            asset.tokenType,
                            asset.token,
                            tokenIds[utxoIndex],
                            msg.sender,
                            safe96(extAmounts[utxoIndex])
                        )
                    );
                scaledAmount = scaleAmount(extAmounts[utxoIndex], asset.scale);
            }

            commitments[utxoIndex] = generateCommitment(
                pubSpendingKeys[utxoIndex].x,
                pubSpendingKeys[utxoIndex].y,
                uint256(scaledAmount),
                uint256(zAssetId),
                timestamp
            );
            // Copy ciphertext into the first words of the message to the receiver
            for (
                uint256 wordIndex = 0;
                wordIndex < CIPHERTEXT1_WORDS;
                wordIndex++
            ) {
                secretMsgs[utxoIndex][wordIndex] = secrets[utxoIndex][
                    wordIndex
                ];
            }
            // Pack zAssetId and scaledAmount as the last word of the message to the receiver
            secretMsgs[utxoIndex][CIPHERTEXT1_WORDS] =
                (uint256(zAssetId) << 96) |
                scaledAmount;
        }

        addAndEmitCommitments(commitments, secretMsgs, timestamp);
    }

    bool verifiedProof;
    function testMerkleProof(
        uint256 leafId,
        bytes32 merkleRoot,
        bytes32 commitment,
        bytes32[TREE_DEPTH + 1] calldata pathElements
    ) external {
        verifiedProof = false;
        verifyMerkleProof(
            merkleRoot,
            getTriadIndex(leafId),
            getTriadNodeIndex(leafId),
            commitment,
            pathElements
        );
        verifiedProof = true;
    }

    function exit(
        address token,
        uint256 tokenId,
        uint256 amount,
        uint256 creationTime,
        uint256 privSpendingKey,
        uint256 leafId,
        bytes32[TREE_DEPTH + 1] calldata pathElements,
        bytes32 merkleRoot,
        uint256 cacheIndexHint
    ) external nonReentrant {
        require(timeNow() >= EXIT_TIME, ERR_TOO_EARLY_EXIT);
        require(amount < MAX_EXT_AMOUNT, ERR_TOO_LARGE_AMOUNT);
        {
            bytes32 nullifier = generateNullifier(privSpendingKey, leafId);
            require(!isSpent[nullifier], ERR_SPENT_NULLIFIER);
            isSpent[nullifier] = true;
            emit Nullifier(nullifier);
        }
        require(
            isKnownRoot(getTreeId(leafId), merkleRoot, cacheIndexHint),
            ERR_UNKNOWN_MERKLE_ROOT
        );

        uint8 tokenType;
        bytes32 commitment;
        {
            uint160 zAssetId;
            uint256 scaledAmount;
            {
                ZAsset memory asset;
                (asset, zAssetId) = getZAssetAndId(token, tokenId);
                require(
                    asset.status == zASSET_ENABLED ||
                        asset.status == zASSET_DISABLED,
                    ERR_WRONG_ASSET
                );
                tokenType = asset.tokenType;
                scaledAmount = uint256(scaleAmount(amount, asset.scale));
            }

            G1Point memory pubSpendingKey = generatePubSpendingKey(
                privSpendingKey
            );
            commitment = generateCommitment(
                pubSpendingKey.x,
                pubSpendingKey.y,
                scaledAmount,
                zAssetId,
                creationTime
            );
        }

        verifyMerkleProof(
            merkleRoot,
            getTriadIndex(leafId),
            getTriadNodeIndex(leafId),
            commitment,
            pathElements
        );

        IVault(VAULT).unlockAsset(
            LockData(tokenType, token, tokenId, msg.sender, safe96(amount))
        );
    }



    /// @notice Add a new "grant type", with the specified amount (in PRPs) of the grant,
    /// and allow the specified "curator" to issue grants of this type
    /// @dev The "owner" may call only
    function enableGrants(
        address curator,
        bytes4 grantType,
        uint256 prpAmount
    ) external onlyOwner {
        enableGrantType(curator, grantType, prpAmount);
    }

    /// @notice Disable previously enabled "grant type"
    /// @dev The "owner" may call only
    function disableGrants(address curator, bytes4 grantType)
        external
        onlyOwner
    {
        disableGrantType(curator, grantType);
    }

    /// @notice Withdraw accidentally sent tokens or ETH from this contract
    /// @dev The "owner" may call only
    function claimEthOrErc20(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner nonReentrant {
        _claimEthOrErc20(token, to, amount);
    }
}
