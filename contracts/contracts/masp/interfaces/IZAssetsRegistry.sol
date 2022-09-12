// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.4;

import { ZAsset } from "../common/Types.sol";

interface IZAssetsRegistry {
    /// @dev declared as view rather than pure to allow for protocol changes
    function getZAssetId(address token, uint256 subId)
        external
        view
        returns (uint160);

    function getZAssetAndIds(address token, uint256 subId)
        external
        view
        returns (
            uint160 zAssetId,
            uint256 _tokenId,
            uint160 zAssetRecId,
            ZAsset memory asset
        );

    function getZAsset(uint160 zAssetRecId)
        external
        view
        returns (ZAsset memory asset);

    function isZAssetWhitelisted(uint160 zAssetRecId)
        external
        view
        returns (bool);

    event AssetAdded(uint160 indexed zAssetRecId, ZAsset asset);
    event AssetStatusChanged(
        uint160 indexed zAssetRecId,
        uint8 newStatus,
        uint8 oldStatus
    );
}
