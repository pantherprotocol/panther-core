// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/**
 * @title (Truncated) Interface of PrpGrantor
 * @dev Only those functions and events included which the `AdvancedStakeRewardController` contract uses
 */
interface IPrpGrantor {
    /// @notice Returns the total amount (in PRPs) of unused grants for the given grantee
    function getUnusedGrantAmount(address grantee)
        external
        view
        returns (uint256 prpAmount);
}
