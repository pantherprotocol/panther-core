// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.4;

contract FakePrpGrantor {
    event DebugRedeem(address grantee, uint256 prpAmount);

    function redeemGrant(address grantee, uint256 prpAmount) external {
        emit DebugRedeem(grantee, prpAmount);
    }
}
