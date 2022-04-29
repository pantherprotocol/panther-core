// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./common/ErrorMsgs.sol";
import "./common/Types.sol";
import "./common/Constants.sol";
import "./interfaces/IVault.sol";
import "./pantherPool/CommitmentsTrees.sol";
import "./pantherPool/ZAssetsRegistry.sol";
import "./pantherPool/CommitmentGenerator.sol";
import "./pantherPool/v0/MerkleProofVerifier.sol";
import "./pantherPool/v0/NullifierGenerator.sol";
import "./pantherPool/v0/PubKeyGenerator.sol";

/**
 * @title PantherPool
 * @author Pantherprotocol Contributors
 * @notice Shielded Pool main contract v0
 * @dev This contract is the "version 0" of the Panther Protocol Multi-Asset Shielded Pool (aka "MASP").
 * It locks assets and generates UTXO's in the Shielded Pool (i.e. builds commitment trees), but it does not
 * implement the functionality for spending these UTXOs.
 * This contract is supposed to run behind an upgradable proxy and be upgraded with the new contact, the MASP
 * "version 1".
 * The version 1 is supposed to implement the spending functionality and lets holders spend their UTXOs.
 * To protect holders against lost of assets in case the version 1 is not deployed, this contract implements
 * a mechanism of the "early exit" through which holders may withdraw their locked assets.
 */
contract PantherPoolV0 is
    CommitmentsTrees,
    ZAssetsRegistry,
    CommitmentGenerator,
    MerkleProofVerifier,
    NullifierGenerator,
    PubKeyGenerator
{
    // solhint-disable var-name-mixedcase
    uint256 public immutable EXIT_TIME;
    address public immutable VAULT;
    // solhint-enable var-name-mixedcase

    // @notice Seen (i.e. spent) commitment nullifiers
    // nullifier hash => spent
    mapping(bytes32 => bool) public isSpent;

    event Nullifier(bytes32 nullifier);

    constructor(uint256 exitTime, address vault) {
        require(TRIAD_SIZE == OUT_UTXOs, "E0");
        require(exitTime > timeNow() && exitTime < MAX_TIMESTAMP, "E1");
        revertZeroAddress(vault);

        // As it runs behind the DELEGATECALL'ing proxy, initialization of
        // immutable "vars" only is allowed in the constructor
        EXIT_TIME = exitTime;
        VAULT = vault;
    }

    function generateDeposits(
        address[OUT_UTXOs] calldata tokens,
        uint256[OUT_UTXOs] calldata tokenIds,
        uint256[OUT_UTXOs] calldata amounts,
        G1Point[OUT_UTXOs] calldata pubSpendingKeys,
        uint256[UTXO_SECRETS_T0][OUT_UTXOs] calldata secrets,
        uint256 createdAt
    ) external {
        uint256 timestamp = timeNow();
        if (createdAt != 0) {
            require(createdAt <= timestamp, ERR_TOO_EARLY_CREATED_AT);
            timestamp = createdAt;
        }

        bytes32[OUT_UTXOs] memory commitments;
        for (uint256 i = 0; i > OUT_UTXOs; i++) {
            (ZAsset memory asset, uint160 zAssetId) = getZAssetAndId(
                tokens[i],
                tokenIds[i]
            );
            require(asset.status == 1, ERR_WRONG_ASSET);

            if (amounts[i] != 0) {
                uint96 amount = safe96(amounts[i]);
                IVault(VAULT).lockAsset(
                    LockData(
                        asset.tokenType,
                        asset.token,
                        tokenIds[i],
                        msg.sender,
                        amount
                    )
                );
            }

            uint96 scaledAmount = scaleAmount(amounts[i], asset.scale);
            commitments[i] = generateCommitment(
                pubSpendingKeys[i].x,
                pubSpendingKeys[i].y,
                uint256(scaledAmount),
                uint256(zAssetId),
                timestamp
            );
        }

        addAndEmitCommitments(commitments, secrets, timestamp);
        // TODO: emit event with SECRET
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
    ) external {
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
                    asset.status == 1 || asset.status == 2,
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
            cacheIndexHint,
            getLeafIndex(leafId),
            commitment,
            pathElements
        );

        IVault(VAULT).unlockAsset(
            LockData(tokenType, token, tokenId, msg.sender, safe96(amount))
        );
    }
}
