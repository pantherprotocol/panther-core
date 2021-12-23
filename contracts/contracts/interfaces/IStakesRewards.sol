// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IStakesRewards {

    function onStaked(address _account, uint256 stakeID, uint256 _amount, bool isJourney) external returns (bool success);

    function onUnstaked(address _account, uint256 stakeID) external returns (bool success);
}
