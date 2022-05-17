// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import { BY_ID_TOKEN_TYPE, zASSET_ENABLED } from "../common/Constants.sol";
import { ERR_ASSET_ALREADY_REGISTERED, ERR_UNKNOWN_ASSET, ERR_WRONG_ASSET_STATUS, ERR_ZERO_TOKEN_ADDRESS } from "../common/ErrorMsgs.sol";
import { ZAsset } from "../common/Types.sol";
import "../common/Utils.sol";
import "../interfaces/IZAssetsRegistry.sol";

/**
 * @title ZAssetsRegistry
 * @author Pantherprotocol Contributors
 * @notice Registry of supported assets (tokens) for the `PantherPool` contract
 */
abstract contract ZAssetsRegistry is Utils, IZAssetsRegistry {
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
        return
            uint160(
                uint256(
                    keccak256(
                        abi.encode(uint256(uint160(token)), uint256(tokenId))
                    )
                ) >> 96
            );
    }

    function getZAsset(uint160 zAssetIdOrRootId)
        public
        view
        override
        returns (ZAsset memory asset)
    {
        asset = _zAssets[zAssetIdOrRootId];
    }

    function getZAssetAndId(address token, uint256 tokenId)
        public
        view
        override
        returns (ZAsset memory asset, uint160 zAssetId)
    {
        uint160 zAssetRootId = getZAssetRootId(token);
        asset = _zAssets[zAssetRootId];
        zAssetId = getZAssetId(token, tokenId);
        if (asset.tokenType == BY_ID_TOKEN_TYPE) asset = _zAssets[zAssetId];
    }

    function isRootIdWhitelisted(uint160 zAssetId)
        external
        view
        override
        returns (bool)
    {
        ZAsset memory asset = _zAssets[zAssetId];
        return asset.status == zASSET_ENABLED;
    }

    function scaleAmount(uint256 amount, uint8 scale)
        public
        pure
        override
        returns (uint96 scaledAmount)
    {
        if (scale == 0) return safe96(amount); // no scaling

        uint256 factor = _getFactor(scale);
        bool isScalingDown = (scale & 0x01) == 0;
        scaledAmount = isScalingDown
            ? safe96(amount / factor) // scale down
            : safe96(amount * factor); // scale up
    }

    function unscaleAmount(uint96 scaledAmount, uint8 scale)
        public
        pure
        override
        returns (uint256 amount)
    {
        if (scale == 0) return scaledAmount; // no scaling

        uint256 factor = _getFactor(scale);
        bool isScalingDown = (scale & 0x01) == 0;
        amount = isScalingDown
            ? uint256(scaledAmount) * factor // unscale up
            : uint256(scaledAmount) / factor; // unscale down
    }

    /// @dev Ensure only an owner may call it (from a child contact)
    function addAsset(ZAsset memory asset) internal {
        uint160 zAssetId = getZAssetId(asset.token, 0);
        require(
            _zAssets[zAssetId].token == address(0),
            ERR_ASSET_ALREADY_REGISTERED
        );
        require(asset.token != address(0), ERR_ZERO_TOKEN_ADDRESS);
        // Checks on other fields skipped to allow for protocol updates.
        _zAssets[zAssetId] = asset;
        emit AssetAdded(zAssetId, asset);
    }

    /// @dev Ensure only an owner may call it (from a child contact)
    function changeAssetStatus(uint160 zAssetId, uint8 newStatus) internal {
        require(_zAssets[zAssetId].token != address(0), ERR_UNKNOWN_ASSET);
        // Check of the status value skipped to allow for protocol updates.
        uint8 oldStatus = _zAssets[zAssetId].status;
        _zAssets[zAssetId].status = newStatus;
        require(oldStatus != newStatus, ERR_WRONG_ASSET_STATUS);
        emit AssetStatusChanged(uint256(zAssetId), newStatus, oldStatus);
    }

    function _getFactor(uint8 scale) private pure returns (uint256) {
        uint256 i = uint256(scale >> 1);
        return ([1e0, 1e1, 1e2, 1e3, 1e4, 1e5, 1e6])[i];
    }

    // NOTE: The contract is supposed to run behind a proxy DELEGATECALLing it.
    // For compatibility on upgrades, decrease `__gap` if new variables added.
    uint256[50] private __gap;
}
