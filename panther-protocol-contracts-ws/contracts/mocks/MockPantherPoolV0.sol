// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.4;

import "../PantherPoolV0.sol";

contract MockPantherPoolV0 is PantherPoolV0 {
    constructor(
        address _owner,
        uint256 exitTime,
        address vault
    ) PantherPoolV0(_owner, exitTime, vault) {}

    event RESULT_processDepositedAsset(uint160 zAssetId, uint96 scaledAmount);

    function internalProcessDepositedAsset(
        address token,
        uint256 tokenId,
        uint256 extAmount
    ) external {
        (uint160 zAssetId, uint96 scaledAmount) = _processDepositedAsset(
            token,
            tokenId,
            extAmount
        );
        emit RESULT_processDepositedAsset(zAssetId, scaledAmount);
    }
}
