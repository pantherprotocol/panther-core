// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../pantherPool/ZAssetsRegistry.sol";
import { ZAsset } from "../common/Types.sol";

contract MockZAssetsRegistry is ZAssetsRegistry {
    function internalAddAsset(ZAsset calldata asset) external {
        addAsset(asset);
    }

    function internalChangeAssetStatus(uint160 zAssetId, uint8 newStatus)
        external
    {
        changeAssetStatus(zAssetId, newStatus);
    }
}
