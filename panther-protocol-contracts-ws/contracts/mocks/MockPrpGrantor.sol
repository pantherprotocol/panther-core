// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.4;

import "../pantherPool/PrpGrantor.sol";

contract MockPrpGrantor is PrpGrantor {
    constructor(uint160 prpZAssetId) PrpGrantor(prpZAssetId) {}

    function internalUseGrant(address grantee, uint256 prpAmount) external {
        useGrant(grantee, prpAmount);
    }

    function internalEnableGrantType(
        address curator,
        bytes4 grantType,
        uint256 prpAmount
    ) external {
        enableGrantType(curator, grantType, prpAmount);
    }

    function internalDisableGrantType(address curator, bytes4 grantType)
        external
    {
        disableGrantType(curator, grantType);
    }
}
