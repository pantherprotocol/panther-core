// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.4;

import { ZAsset } from "../common/Types.sol";

contract FakeZAssetsRegistry {
    mapping(uint160 => ZAsset) private _registry;

    function getZAsset(uint160 zAssetRecId)
        public
        view
        returns (ZAsset memory asset)
    {
        asset = _registry[zAssetRecId];
    }

    function addZAsset(ZAsset memory asset) external {
        _registry[uint160(asset.token) ^ uint160(asset.version)] = asset;
    }
}
