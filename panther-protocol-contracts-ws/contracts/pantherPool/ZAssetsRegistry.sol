// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import { ERC20_TOKEN_TYPE, zASSET_ENABLED, zASSET_UNKNOWN } from "../common/Constants.sol";
import { ERR_ASSET_ALREADY_REGISTERED, ERR_UNKNOWN_ASSET, ERR_ZERO_TOKENID_EXPECTED } from "../common/ErrorMsgs.sol";
import { ERR_WRONG_ASSET_SCALE, ERR_WRONG_ASSET_STATUS, ERR_ZERO_TOKEN_ADDRESS } from "../common/ErrorMsgs.sol";
import { ZAsset } from "../common/Types.sol";
import "../common/Utils.sol";
import "../interfaces/IZAssetsRegistry.sol";

/**
 * @title ZAssetsRegistry
 * @author Pantherprotocol Contributors
 * @notice Registry of supported assets (tokens) for the `PantherPool` contract
 */
abstract contract ZAssetsRegistry is Utils, IZAssetsRegistry {
    // "zAsset RootID" - ID of the token contract.
    // "zAsset ID" - ID of a particular NFT token (w/ its unique `tokenId`),
    // or (one) ID for all ERC20 (fungible) tokens on a same token contract.

    // Mapping from "zAsset RootID" to asset params
    mapping(uint160 => ZAsset) private _zAssets;

    function getZAssetRootId(address token)
        public
        pure
        override
        returns (uint160)
    {
        return uint160(token);
    }

    function getZAssetId(address token, uint256 tokenId)
        public
        pure
        override
        returns (uint160)
    {
        require(token != address(0), ERR_ZERO_TOKEN_ADDRESS);
        // Surely less then the FIELD_SIZE
        return
            uint160(
                uint256(
                    keccak256(
                        abi.encode(uint256(uint160(token)), uint256(tokenId))
                    )
                ) >> 96
            );
    }

    function getZAsset(uint160 zAssetRootId)
        public
        view
        override
        returns (ZAsset memory asset)
    {
        asset = _zAssets[zAssetRootId];
    }

    function getZAssetAndId(address token, uint256 tokenId)
        public
        view
        override
        returns (ZAsset memory asset, uint160 zAssetId)
    {
        uint160 zAssetRootId = getZAssetRootId(token);
        asset = _zAssets[zAssetRootId];

        if (asset.status == zASSET_UNKNOWN) {
            zAssetId = uint160(0);
        } else {
            require(
                asset.tokenType != ERC20_TOKEN_TYPE || tokenId == 0,
                ERR_ZERO_TOKENID_EXPECTED
            );
            zAssetId = getZAssetId(token, tokenId);
        }
    }

    function isZAssetWhitelisted(uint160 zAssetRootId)
        external
        view
        override
        returns (bool)
    {
        ZAsset memory asset = _zAssets[zAssetRootId];
        return asset.status == zASSET_ENABLED;
    }

    function scaleAmount(uint256 amount, uint8 scale)
        public
        pure
        override
        returns (uint96 scaledAmount)
    {
        _checkScaleInRange(scale);
        return _scaleAmount(amount, scale);
    }

    function unscaleAmount(uint96 scaledAmount, uint8 scale)
        public
        pure
        override
        returns (uint256 amount)
    {
        _checkScaleInRange(scale);
        return _unscaleAmount(scaledAmount, scale);
    }

    function _scaleAmount(uint256 amount, uint8 scale)
        internal
        pure
        returns (uint96 scaledAmount)
    {
        if (scale == 0) return safe96(amount); // no scaling

        (uint256 factor, bool isScalingDown) = _getFactor(scale);
        scaledAmount = isScalingDown
            ? safe96(amount / factor) // scale down
            : safe96(amount * factor); // scale up
    }

    function _unscaleAmount(uint96 scaledAmount, uint8 scale)
        internal
        pure
        returns (uint256 amount)
    {
        if (scale == 0) return scaledAmount; // no scaling

        (uint256 factor, bool isScalingDown) = _getFactor(scale);
        amount = isScalingDown
            ? uint256(scaledAmount) * factor // unscale up
            : uint256(scaledAmount) / factor; // unscale down
    }

    /// @dev Ensure only an owner may call it (from a child contact)
    function _addAsset(ZAsset memory asset) internal {
        require(asset.token != address(0), ERR_ZERO_TOKEN_ADDRESS);
        _checkScaleInRange(asset.scale);
        // Other status options are not checked to allow protocol extension
        require(asset.status != zASSET_UNKNOWN, ERR_WRONG_ASSET_STATUS);

        uint160 zAssetRootId = getZAssetRootId(asset.token);
        require(
            _zAssets[zAssetRootId].token == address(0),
            ERR_ASSET_ALREADY_REGISTERED
        );
        _zAssets[zAssetRootId] = asset;
        emit AssetAdded(zAssetRootId, asset);
    }

    /// @dev Ensure only an owner may call it (from a child contact)
    function _changeAssetStatus(uint160 zAssetRootId, uint8 newStatus)
        internal
    {
        require(_zAssets[zAssetRootId].token != address(0), ERR_UNKNOWN_ASSET);
        uint8 oldStatus = _zAssets[zAssetRootId].status;
        // New status value restrictions relaxed to allow for protocol updates.
        require(
            newStatus != zASSET_UNKNOWN && oldStatus != newStatus,
            ERR_WRONG_ASSET_STATUS
        );
        _zAssets[zAssetRootId].status = newStatus;
        emit AssetStatusChanged(zAssetRootId, newStatus, oldStatus);
    }

    // Returns `10**(scale % 8)` as the factor and `scale & 0x08` as isScaledUp
    // Calling code must ensure nonZeroScale is in the range (1..7,9..15)
    function _getFactor(uint8 nonZeroScale)
        private
        pure
        returns (uint256 factor, bool isScalingDown)
    {
        unchecked {
            uint256 i = uint256(nonZeroScale & 0x07);
            factor = ([1e1, 1e2, 1e3, 1e4, 1e5, 1e6, 1e7])[--i];
            isScalingDown = (nonZeroScale & 0x08) == 0;
        }
    }

    function _checkScaleInRange(uint8 scale) private pure {
        //  Valid range is (0..7,9..15)
        bool isInRange = (scale != 8) && (scale < 16);
        require(isInRange, ERR_WRONG_ASSET_SCALE);
    }

    // NOTE: The contract is supposed to run behind a proxy DELEGATECALLing it.
    // For compatibility on upgrades, decrease `__gap` if new variables added.
    uint256[50] private __gap;
}
