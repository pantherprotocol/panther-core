// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.4;

import "../common/Constants.sol";
import "./errMsgs/PantherPoolErrMsgs.sol";
import "../common/ImmutableOwnable.sol";
import "../common/NonReentrant.sol";
import "../common/Types.sol";
import "../common/Utils.sol";
import "./interfaces/IPrpGrantor.sol";
import "./interfaces/IVault.sol";
import "./interfaces/IZAssetsRegistry.sol";
import "../common/Claimable.sol";
import "./pantherPool/AmountConvertor.sol";
import "./pantherPool/CommitmentGenerator.sol";
import "./pantherPool/CommitmentsTrees.sol";
import "./pantherPool/MerkleProofVerifier.sol";
import "./pantherPool/NullifierGenerator.sol";
import "./pantherPool/PubKeyGenerator.sol";

/**
 * @title PantherPool
 * @author Pantherprotocol Contributors
 * @notice Multi-Asset Shielded Pool main contract v0
 * @dev It is the "version 0" of the Panther Protocol Multi-Asset Shielded Pool ("MASP").
 * It locks assets (ERC-20, ERC-721 or ERC-1155 tokens) of a user with the `Vault` smart
 * contract and generates UTXO's in the MASP for the user (i.e. builds merkle trees of
 * UTXO's commitments).
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
    // slither-disable-next-line shadowing-state
    uint256[50] private __gap;

    // solhint-disable var-name-mixedcase

    /// @notice Address of the ZAssetRegistry contract
    address public immutable ASSET_REGISTRY;

    /// @notice Address of the Vault contract
    address public immutable VAULT;

    /// @notice (UNIX) Time since when the `exit` calls get enabled
    uint32 public exitTime;

    /// @notice Period (seconds) since `commitToExit` when `exit` opens
    // Needed to mitigate front-run attacks on `exit`
    uint24 public exitDelay;

    // (rest of the storage slot) reserved for upgrades
    uint200 private _reserved;

    // solhint-enable var-name-mixedcase

    // @notice Seen (i.e. spent) commitment nullifiers
    // nullifier hash => spent
    mapping(bytes32 => bool) public isSpent;

    /// @notice Unused registered commitments to exit
    // hash(privSpendKey, recipient) => commitment timestamp
    mapping(bytes32 => uint32) public exitCommitments;

    /// @dev Emitted when exit time and/or exit delay updated
    event ExitTimesUpdated(uint256 newExitTime, uint256 newExitDelay);

    /// @dev New nullifier has been seen
    event Nullifier(bytes32 nullifier);

    /// @dev A tiny disowned token amount gets locked in the Vault
    /// (as a result of imprecise scaling of deposited amounts)
    event Change(address indexed token, uint256 change);

    /// @dev New exit commitment registered
    event ExitCommitment(uint256 timestamp);

    /// @param _owner Address of the `OWNER` who may call `onlyOwner` methods
    /// @param assetRegistry Address of the ZAssetRegistry contract
    /// @param vault Address of the Vault contract
    constructor(
        address _owner,
        address assetRegistry,
        address vault
    ) ImmutableOwnable(_owner) {
        require(TRIAD_SIZE == OUT_UTXOs, "E0");

        revertZeroAddress(assetRegistry);
        revertZeroAddress(vault);

        // As it runs behind the DELEGATECALL'ing proxy, initialization of
        // immutable "vars" only is allowed in the constructor

        ASSET_REGISTRY = assetRegistry;
        VAULT = vault;
    }

    /// @notice Update the exit time and the exit delay
    /// @dev Owner only may calls
    function updateExitTimes(uint32 newExitTime, uint24 newExitDelay)
        public
        onlyOwner
    {
        require(
            newExitTime >= exitTime &&
                newExitTime < MAX_TIMESTAMP &&
                newExitDelay != 0,
            "E1"
        );

        exitTime = newExitTime;
        exitDelay = newExitDelay;

        emit ExitTimesUpdated(uint256(newExitTime), uint256(newExitDelay));
    }

    /// @notice Transfer assets from the msg.sender to the VAULT and generate UTXOs in the MASP
    /// @param tokens Address of the token contract for every UTXO
    /// @param tokenIds For ERC-721 and ERC-1155 - token ID or subId of the token, 0 for ERC-20
    /// @param amounts Token amounts (unscaled) to be deposited
    /// @param pubSpendingKeys Public Spending Key for every UTXO
    /// @param secrets Encrypted opening values for every UTXO
    /// @param createdAt Optional, if 0 the network time used
    /// @dev createdAt must be less (or equal) the network time
    /// @return leftLeafId The `leafId` of the first UTXO (leaf) in the batch
    function generateDeposits(
        address[OUT_MAX_UTXOs] calldata tokens,
        uint256[OUT_MAX_UTXOs] calldata tokenIds,
        uint256[OUT_MAX_UTXOs] calldata amounts,
        G1Point[OUT_MAX_UTXOs] calldata pubSpendingKeys,
        uint256[CIPHERTEXT1_WORDS][OUT_MAX_UTXOs] calldata secrets,
        uint32 createdAt
    ) external nonReentrant returns (uint256 leftLeafId) {
        require(exitTime > 0, ERR_UNCONFIGURED_EXIT_TIME);

        uint32 timestamp = safe32TimeNow();
        if (createdAt != 0) {
            require(createdAt <= timestamp, ERR_TOO_EARLY_CREATED_AT);
            timestamp = createdAt;
        }

        bytes32[OUT_MAX_UTXOs] memory commitments;
        bytes[OUT_MAX_UTXOs] memory perUtxoData;

        // Types of UTXO data messages packed into one byte
        uint8 msgTypes = uint8(0);

        for (uint256 utxoIndex = 0; utxoIndex < OUT_MAX_UTXOs; utxoIndex++) {
            (uint160 zAssetId, uint64 scaledAmount) = _processDepositedAsset(
                tokens[utxoIndex],
                tokenIds[utxoIndex],
                amounts[utxoIndex]
            );

            if (utxoIndex != 0) msgTypes = msgTypes << 2;

            if (scaledAmount == 0) {
                // the zero UTXO
                // At least the 1st deposited amount shall be non-zero
                require(utxoIndex != 0, ERR_ZERO_DEPOSIT);

                commitments[utxoIndex] = ZERO_VALUE;
                perUtxoData[utxoIndex] = "";
                // As UTXO_DATA_TYPE5 is 0, next statement may be skipped
                // msgTypes |= UTXO_DATA_TYPE5;
            } else {
                // non-zero UTXO
                commitments[utxoIndex] = generateCommitment(
                    pubSpendingKeys[utxoIndex].x,
                    pubSpendingKeys[utxoIndex].y,
                    scaledAmount,
                    zAssetId,
                    timestamp
                );

                uint256 zAssetIdAndAmount = (uint256(zAssetId) << 96) |
                    uint256(scaledAmount);

                if (tokenIds[utxoIndex] != 0) {
                    msgTypes |= UTXO_DATA_TYPE1;
                    perUtxoData[utxoIndex] = abi.encodePacked(
                        secrets[utxoIndex],
                        zAssetIdAndAmount
                    );
                } else {
                    msgTypes |= UTXO_DATA_TYPE3;
                    perUtxoData[utxoIndex] = abi.encodePacked(
                        secrets[utxoIndex],
                        zAssetIdAndAmount,
                        tokenIds[utxoIndex]
                    );
                }
            }
        }

        leftLeafId = addAndEmitCommitments(
            commitments,
            msgTypes,
            perUtxoData,
            timestamp
        );
    }

    /// @notice Register future `exit` to protect against front-run and DoS.
    /// The `exit` is possible only after `exitDelay` since this function call.
    /// @param exitCommitment Commitment to the UTXO spending key and the recipient address.
    /// MUST be equal to keccak256(abi.encode(uint256(privSpendingKey), address(recipient)).
    function commitToExit(bytes32 exitCommitment) external {
        // slither-disable-next-line incorrect-equality
        require(
            exitCommitments[exitCommitment] == uint32(0),
            ERR_EXITCOMMIT_EXISTS
        );
        uint32 timestamp = safe32TimeNow();
        exitCommitments[exitCommitment] = timestamp;
        emit ExitCommitment(timestamp);
    }

    /// @notice Spend an UTXO in the MASP and withdraw the asset from the Vault to the msg.sender.
    /// This function call must be registered in advance with `commitToExit`.
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
        uint64 scaledAmount,
        uint32 creationTime,
        uint256 privSpendingKey,
        uint256 leafId,
        bytes32[TREE_DEPTH + 1] calldata pathElements,
        bytes32 merkleRoot,
        uint256 cacheIndexHint
    ) external nonReentrant {
        // if exitTime == 0 -> `exit` is not accepted since init phase is not finished yet
        require(
            safe32TimeNow() >= exitTime && exitTime != 0,
            ERR_TOO_EARLY_EXIT
        );
        _verifyExitCommitment(privSpendingKey, msg.sender);

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
    ) internal returns (uint160 zAssetId, uint64 scaledAmount) {
        // Do nothing if it's the "zero" (or "dummy") deposit
        if (amount == 0) {
            // Both token and subId must be zeros for the "zero" deposit
            require(token == address(0) && subId == 0, ERR_WRONG_DEPOSIT);
            return (0, 0);
        }
        // amount can't be zero here and further

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

    function _verifyExitCommitment(uint256 privSpendingKey, address recipient)
        internal
    {
        bytes32 commitment = keccak256(abi.encode(privSpendingKey, recipient));

        uint32 commitmentTime = exitCommitments[commitment];
        require(commitmentTime != uint32(0), ERR_EXITCOMMIT_MISSING);

        uint256 allowedTime = uint256(commitmentTime) + uint256(exitDelay);
        require(timeNow() > allowedTime, ERR_EXITCOMMIT_LOCKED);

        // Let's gain some gas back
        exitCommitments[commitment] = uint32(0);
        // No extra event emitted as spent UTXO and withdrawal events will fire
    }
}
