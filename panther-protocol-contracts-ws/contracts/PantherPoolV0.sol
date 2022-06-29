// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.4;

import "./common/Constants.sol";
import "./common/ErrorMsgs.sol";
import "./common/ImmutableOwnable.sol";
import "./common/NonReentrant.sol";
import "./common/Types.sol";
import "./common/Utils.sol";
import "./interfaces/IPrpGrantor.sol";
import "./interfaces/IVault.sol";
import "./interfaces/IZAssetsRegistry.sol";
import "./common/Claimable.sol";
import "./pantherPool/AmountConvertor.sol";
import "./pantherPool/CommitmentGenerator.sol";
import "./pantherPool/CommitmentsTrees.sol";
import "./pantherPool/v0/MerkleProofVerifier.sol";
import "./pantherPool/v0/NullifierGenerator.sol";
import "./pantherPool/v0/PubKeyGenerator.sol";

/**
 * @title PantherPool
 * @author Pantherprotocol Contributors
 * @notice Multi-Asset Shielded Pool main contract v0
 * @dev It is the "version 0" of the Panther Protocol Multi-Asset Shielded Pool ("MASP").
 * It locks assets (ERC-20, ERC-721 or ERC-1155 tokens) of a user with the `Vault` smart
 * contract and generates UTXO's in the MASP for the user (i.e. builds merkle trees of
 * UTXO's commitments).
 * It can also generate UTX0's with "Panther Reward Points" (aka "PRP", a special unit).
 * To get a PRP UTXO, a user must be given a "grant" booked in the `PrpGrantor` contract.
 * The present contract is assumed to have the "grant processor" role with the latest.
 * This contract does not implement the functionality for spending UTXO's (other than the
 * `exit` described further) and is supposed to be upgraded with the new one.
 * The new contract, the "v.1" of the MASP, is planned to implement spending of UTXO's
 * using zero-knowledge proves.
 * To be upgradable, this contract is assumed to run as an "implementation" for a proxy
 * that DELEGATECALL's the implementation.
 * To protect holders against lost of assets in case this contract is not upgraded, it
 * exposes the `exit` function, through which users may withdraw their locked assets via
 * revealing preimages of commitments.
 */
contract PantherPoolV0 is
    ImmutableOwnable,
    NonReentrant,
    Claimable,
    CommitmentsTrees,
    AmountConvertor,
    CommitmentGenerator,
    MerkleProofVerifier,
    NullifierGenerator,
    PubKeyGenerator,
    Utils
{
    // The contract is supposed to run behind a proxy DELEGATECALLing it.
    // On upgrades, adjust `__gap` to match changes of the storage layout.
    uint256[50] private __gap;

    // solhint-disable var-name-mixedcase

    /// @notice (UNIX) Time since when the `exit` calls get enabled
    uint256 private immutable EXIT_TIME;

    /// @notice Address of the ZAssetRegistry contract
    address public immutable ASSET_REGISTRY;

    /// @notice Address of the Vault contract
    address public immutable VAULT;

    /// @notice Address of the PrpGrantor contract
    address public immutable PRP_GRANTOR;

    // solhint-enable var-name-mixedcase

    // @notice Seen (i.e. spent) commitment nullifiers
    // nullifier hash => spent
    mapping(bytes32 => bool) public isSpent;

    /// @dev New nullifier has been seen
    event Nullifier(bytes32 nullifier);

    /// @dev A tiny disowned token amount gets locked in the Vault
    /// (as a result of imprecise scaling of deposited amounts)
    event Change(address indexed token, uint256 change);

    /// @param _owner Address of the `OWNER` who may call `onlyOwner` methods
    /// @param _exitTime (UNIX) Time since when the `exit` calls get enabled
    /// @param assetRegistry Address of the ZAssetRegistry contract
    /// @param vault Address of the Vault contract
    /// @param prpGrantor Address of the PrpGrantor contract
    constructor(
        address _owner,
        uint256 _exitTime,
        address vault,
        address prpGrantor
    ) ImmutableOwnable(_owner) {
        require(TRIAD_SIZE == OUT_UTXOs, "E0");
        require(_exitTime > timeNow() && _exitTime < MAX_TIMESTAMP, "E1");
        revertZeroAddress(vault);
        revertZeroAddress(prpGrantor);

        // As it runs behind the DELEGATECALL'ing proxy, initialization of
        // immutable "vars" only is allowed in the constructor
        EXIT_TIME = _exitTime;
        VAULT = vault;
        PRP_GRANTOR = prpGrantor;
    }

    /// @notice Reads and returns the exit time.
    /// @dev This function helps to ease testing. It can be overridden in the
    /// test contract
    function exitTime() public view virtual returns (uint256) {
        return EXIT_TIME;
    }

    /// @notice Transfer assets from the msg.sender to the VAULT and generate UTXOs in the MASP
    /// @param tokens Address of the token contract for every UTXO
    /// @dev For PRP granted the address ot this contract (proxy) is supposed to be used
    /// @param tokenIds For ERC-721 and ERC-1155 - token ID or subId of the token, 0 for ERC-20
    /// @param amounts Token amounts (unscaled) to be deposited
    /// @param pubSpendingKeys Public Spending Key for every UTXO
    /// @param secrets Encrypted opening values for every UTXO
    /// @param createdAt Optional, if 0 the network time used
    /// @dev createdAt must be less (or equal) the network time
    /// @return leftLeafId The `leafId` of the first UTXO (leaf) in the batch
    function generateDeposits(
        address[OUT_UTXOs] calldata tokens,
        uint256[OUT_UTXOs] calldata tokenIds,
        uint256[OUT_UTXOs] calldata amounts,
        G1Point[OUT_UTXOs] calldata pubSpendingKeys,
        uint256[CIPHERTEXT1_WORDS][OUT_UTXOs] calldata secrets,
        uint32 createdAt
    ) external nonReentrant returns (uint256 leftLeafId) {
        uint32 timestamp = safe32TimeNow();
        if (createdAt != 0) {
            require(createdAt <= timestamp, ERR_TOO_EARLY_CREATED_AT);
            timestamp = createdAt;
        }

        bytes32[OUT_UTXOs] memory commitments;
        bytes[OUT_UTXOs] memory perUtxoData;

        for (uint256 utxoIndex = 0; utxoIndex < OUT_UTXOs; utxoIndex++) {
            (uint160 zAssetId, uint96 scaledAmount) = _processDepositedAsset(
                tokens[utxoIndex],
                tokenIds[utxoIndex],
                amounts[utxoIndex]
            );

            if (scaledAmount == 0) {
                // At least the 1st deposited amount shall be non-zero
                require(utxoIndex != 0, ERR_ZERO_DEPOSIT);

                // the zero UTXO
                commitments[utxoIndex] = ZERO_VALUE;
                perUtxoData[utxoIndex] = abi.encodePacked(UTXO_DATA_TYPE_ZERO);
            } else {
                // non-zero UTXO
                commitments[utxoIndex] = generateCommitment(
                    pubSpendingKeys[utxoIndex].x,
                    pubSpendingKeys[utxoIndex].y,
                    uint96(scaledAmount),
                    zAssetId,
                    timestamp
                );

                uint256 tokenAndAmount = (uint256(uint160(tokens[utxoIndex])) <<
                    96) | uint256(scaledAmount);
                perUtxoData[utxoIndex] = abi.encodePacked(
                    uint8(UTXO_DATA_TYPE1),
                    secrets[utxoIndex],
                    tokenAndAmount,
                    tokenIds[utxoIndex]
                );
            }
        }

        leftLeafId = addAndEmitCommitments(commitments, perUtxoData, timestamp);
    }

    /// @notice Spend an UTXO in the MASP and withdraw the asset from the Vault to the msg.sender
    /// @param token Address of the token contract
    /// @param subId '_tokenId'/'_id' for ERC-721/1155, 0 for the "default" zAsset of an ERC-20 token,
    // or `subId` for an "alternative" zAsset of an ERC-20 (see ZAssetRegistry.sol for details)
    /// @param scaledAmount Token scaled amount
    /// @param privSpendingKey UTXO's Private Spending Key
    /// @param leafId Id of the leaf with the UTXO commitments in the Merkle Trees
    /// @param pathElements Elements of the Merkle proof of inclusion
    /// @param merkleRoot The root of the Merkle Tree the leaf is a part of
    /// @param cacheIndexHint Index of the `merkleRoot` in the cache of roots, 0 by default
    /// @dev `cacheIndexHint` needed for the "current" (partially populated) tree only
    function exit(
        address token,
        uint256 subId,
        uint96 scaledAmount,
        uint32 creationTime,
        uint256 privSpendingKey,
        uint256 leafId,
        bytes32[TREE_DEPTH + 1] calldata pathElements,
        bytes32 merkleRoot,
        uint256 cacheIndexHint
    ) external nonReentrant {
        require(timeNow() >= exitTime(), ERR_TOO_EARLY_EXIT);
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

        ZAsset memory asset;
        uint256 _tokenId;
        {
            bytes32 commitment;
            {
                uint160 zAssetId;
                {
                    (zAssetId, _tokenId, , asset) = IZAssetsRegistry(
                        ASSET_REGISTRY
                    ).getZAssetAndIds(token, subId);
                    require(asset.status == zASSET_ENABLED, ERR_WRONG_ASSET);
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
                _getTriadIndex(leafId),
                _getTriadNodeIndex(leafId),
                commitment,
                pathElements
            );
        }

        uint96 amount = _unscaleAmount(scaledAmount, asset.scale);
        IVault(VAULT).unlockAsset(
            LockData(asset.tokenType, token, _tokenId, msg.sender, amount)
        );
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

    /// Internal and private functions follow

    // Declared `internal` rather than `private` to ease testing
    function _processDepositedAsset(
        address token,
        uint256 subId,
        uint256 amount
    ) internal returns (uint160 zAssetId, uint96 scaledAmount) {
        // Do nothing if it's the "zero" (or "dummy") deposit
        if (amount == 0) {
            // Both token and subId must be zeros for the "zero" deposit
            require(token == address(0) && subId == 0, ERR_WRONG_DEPOSIT);
            return (0, 0);
        }
        // amount can't be zero here and further

        // Use a PRP grant, if it's a "deposit" in PRPs
        if (token == PRP_VIRTUAL_CONTRACT) {
            require(subId == 0, ERR_ZERO_TOKENID_EXPECTED);
            // Check amount is within the limit (no amount scaling for PRPs)
            uint96 _sanitizedAmount = _sanitizeScaledAmount(amount);
            // No reentrancy guard needed for the trusted contract call
            IPrpGrantor(PRP_GRANTOR).redeemGrant(msg.sender, amount);
            return (PRP_ZASSET_ID, _sanitizedAmount);
        }

        // At this point, a non-zero deposit of a real asset (token) expected
        uint256 _tokenId;
        ZAsset memory asset;
        (zAssetId, _tokenId, , asset) = IZAssetsRegistry(ASSET_REGISTRY)
            .getZAssetAndIds(token, subId);
        require(asset.status == zASSET_ENABLED, ERR_WRONG_ASSET);

        // Scale amount, if asset.scale provides for it (ERC-20 only)
        uint256 change;
        (scaledAmount, change) = _scaleAmount(amount, asset.scale);

        // The `change` will remain locked in the Vault until it's claimed
        // (when and if future upgrades implement change claiming)
        if (change > 0) emit Change(token, change);

        IVault(VAULT).lockAsset(
            LockData(
                asset.tokenType,
                asset.token,
                _tokenId,
                msg.sender,
                uint96(amount)
            )
        );

        return (zAssetId, scaledAmount);
    }
}
