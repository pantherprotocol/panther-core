// SPDX-License-Identifier: MIT
// slither-disable-next-line solc-version
pragma solidity ^0.8.4;

/// @dev Interface to call `totalStaked` on the Staking contract
interface ITotalStaked {
    function totalStaked() external returns (uint96);
}
