// SPDX-License-Identifier: UNLICENSED
// solhint-disable-next-line compiler-fixed, compiler-gt-0_8
pragma solidity ^0.8.4;

/// @dev It simulates (but not precisely!!!) `IPrpGrantor`.
contract FakePrpGrantor {
    // mapping from "grantee" to the PRP amount that may be "used"
    mapping(address => uint256) private _unusedPrpGrants;

    function getUnusedGrantAmount(address grantee)
        external
        view
        returns (uint256 prpAmount)
    {
        return _unusedPrpGrants[grantee];
    }

    function issueOwnerGrant(address grantee, uint256 prpAmount) external {
        unchecked {
            if (prpAmount != 0) {
                uint256 newBalance = _unusedPrpGrants[grantee] + prpAmount;
                _unusedPrpGrants[grantee] = newBalance;
            }
        }
    }

    event DebugRedeem(address grantee, uint256 prpAmount);

    function redeemGrant(address grantee, uint256 prpAmount) external {
        emit DebugRedeem(grantee, prpAmount);
    }
}
