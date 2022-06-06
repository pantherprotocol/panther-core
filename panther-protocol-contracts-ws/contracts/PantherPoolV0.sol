// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
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
 * @notice Multi-Asset Shielded Pool main contract v0
 * @dev It is the "version 0" of the Panther Protocol Multi-Asset Shielded Pool ("MASP").
 * It locks assets (ERC-20, ERC-721 or ERC-1155 tokens) of a user with the `Vault` smart
 * contract and generates UTXO's in the MASP the user owns (i.e. builds merkle trees of
 * UTXO's commitments), but it does not implement the functionality for spending UTXO's
 * (other than the "exit" described further).
 * This contract is supposed to be upgraded with the new one, the MASP "v.1", which will
 * implement spending of UTXO's using zero-knowledge proves.
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

    /// @notice (UNIX) Time since when the `exit` calls get enabled
    uint256 public immutable EXIT_TIME;

    /// @notice Address of the Vault contract
    address public immutable VAULT;

    // solhint-enable var-name-mixedcase

    // @notice Seen (i.e. spent) commitment nullifiers
    // nullifier hash => spent
    mapping(bytes32 => bool) public isSpent;

    event Nullifier(bytes32 nullifier);

    /// @param _owner Address of the `OWNER` who may call `onlyOwner` methods
    /// @param exitTime (UNIX) Time since when the `exit` calls get enabled
    /// @param vault Address of the Vault contract
    constructor(
        address _owner,
        uint256 exitTime,
        address vault
    )
        ImmutableOwnable(_owner)
        PrpGrantor(getZAssetId(PRP_VIRTUAL_CONTRACT, 0))
    {
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
    /// @return leftLeafId The `leafId` of the first UTXO (leaf) in the batch
    function generateDeposits(
        address[OUT_UTXOs] calldata tokens,
        uint256[OUT_UTXOs] calldata tokenIds,
        uint256[OUT_UTXOs] calldata extAmounts,
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
                extAmounts[utxoIndex]
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
                    uint256(scaledAmount),
                    zAssetId,
                    timestamp
                );

                uint256 tokenAndAmount = (uint256(uint160(tokens[utxoIndex])) <<
                    96) | scaledAmount;
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
    /// @param tokenId ERC-721/1155 tokenId, 0 for ERC-20
    /// @param amount Token amount
    /// @param privSpendingKey UTXO's Private Spending Key
    /// @param leafId Id of the leaf with the UTXO commitments in the Merkle Trees
    /// @param pathElements Elements of the Merkle proof of inclusion
    /// @param merkleRoot The root of the Merkle Tree the leaf is a part of
    /// @param cacheIndexHint Index of the `merkleRoot` in the cache of roots, 0 by default
    /// @dev `cacheIndexHint` needed for the "current" (partially populated) tree only
    function exit(
        address token,
        uint256 tokenId,
        uint256 amount,
        uint32 creationTime,
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
            _getTriadIndex(leafId),
            _getTriadNodeIndex(leafId),
            commitment,
            pathElements
        );

        IVault(VAULT).unlockAsset(
            LockData(tokenType, token, tokenId, msg.sender, safe96(amount))
        );
    }

    /// @notice Register a new asset with the given params as a "zAsset" with the MASP
    /// @param asset Params of the asset (including its `ZAsset.status`)
    /// @dev The "owner" may call only
    function addAsset(ZAsset memory asset) external onlyOwner {
        _addAsset(asset);
    }

    /// @notice Set the status of the given "zAsset" to the given value
    /// @dev The "owner" may call only
    function changeAssetStatus(uint160 zAssetRootId, uint8 newStatus)
        external
        onlyOwner
    {
        _changeAssetStatus(zAssetRootId, newStatus);
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

    /// Internal and private functions follow

    function _processDepositedAsset(
        address token,
        uint256 tokenId,
        uint256 extAmount
    ) internal returns (uint160 zAssetId, uint96 scaledAmount) {
        // extAmount may be zero if only both token and tokenId are zeros
        require(
            extAmount != 0 || (token == address(0) && tokenId == 0),
            ERR_WRONG_DEPOSIT
        );

        // Do nothing for "zero" UTXO
        if (token == address(0)) return (0, 0);

        if (token == PRP_VIRTUAL_CONTRACT) {
            // PRP grant assumed
            require(tokenId == 0, ERR_ZERO_TOKENID_EXPECTED);
            if (extAmount != 0) useGrant(msg.sender, extAmount);

            // no amount scaling
            return (PRP_ZASSET_ID, safe96(extAmount));
        }

        // Process "Normal" zAsset, w/ scaling, if it comes here

        ZAsset memory asset;
        (asset, zAssetId) = getZAssetAndId(token, tokenId);
        require(asset.status == zASSET_ENABLED, ERR_WRONG_ASSET);

        // extAmount can't be zero here
        scaledAmount = scaleAmount(extAmount, asset.scale);
        // revert, if extAmount gets scaled to zero
        require(scaledAmount != 0, ERR_TOO_SMALL_AMOUNT);

        IVault(VAULT).lockAsset(
            LockData(
                asset.tokenType,
                asset.token,
                tokenId,
                msg.sender,
                safe96(extAmount)
            )
        );

        return (zAssetId, scaleAmount(extAmount, asset.scale));
    }
}
