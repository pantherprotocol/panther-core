// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import { ZAsset } from "../common/Types.sol";

interface IZAssetsRegistry {
    /// @dev to allow for (possible) protocol changes declared view rather than pure
    function getZAssetRootId(address token) external view returns (uint160);

    /// @dev to allow for (possible) protocol changes declared view rather than pure
    function getZAssetId(address token, uint256 tokenId)
        external
        view
        returns (uint160);

    function getZAsset(uint160 zAssetIdOrRootId)
        external
        view
        returns (ZAsset memory);

    function getZAssetAndId(address token, uint256 tokenId)
        external
        view
        returns (ZAsset memory asset, uint160 zAssetId);

    function isRootIdWhitelisted(uint160 zAssetId) external view returns (bool);

    function scaleAmount(uint256 amount, uint8 scale)
        external
        pure
        returns (uint96);

    function unscaleAmount(uint96 scaledAmount, uint8 scale)
        external
        pure
        returns (uint256);

    event AssetAdded(uint256 indexed zAssetId, ZAsset asset);
    event AssetStatusChanged(
        uint256 indexed zAssetId,
        uint8 newStatus,
        uint8 oldStatus
    );
}
