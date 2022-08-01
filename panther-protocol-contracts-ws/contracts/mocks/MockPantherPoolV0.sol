// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.4;

import "../PantherPoolV0.sol";

contract MockPantherPoolV0 is PantherPoolV0 {
    constructor(
        address _owner,
        address assetRegistry,
        address vault,
        address prpGrantor
    ) PantherPoolV0(_owner, assetRegistry, vault, prpGrantor) {}

    event RESULT_processDepositedAsset(uint160 zAssetId, uint96 scaledAmount);

    function internalProcessDepositedAsset(
        address token,
        uint256 subId,
        uint256 extAmount
    ) external {
        (uint160 zAssetId, uint96 scaledAmount) = _processDepositedAsset(
            token,
            subId,
            extAmount
        );
        emit RESULT_processDepositedAsset(zAssetId, scaledAmount);
    }
}
