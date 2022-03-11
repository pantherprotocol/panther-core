// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @dev Interface to call `totalStaked` on the Staking contract
interface ITotalStaked {
    function totalStaked() external returns (uint96);
}
