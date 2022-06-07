// SPDX-License-Identifier: UNLICENSED
// solhint-disable-next-line compiler-fixed, compiler-gt-0_8
pragma solidity ^0.8.0;

import "../AdvancedStakeRewardController.sol";

contract MockAdvancedStakeRewardController is AdvancedStakeRewardController {
    constructor(
        address _owner,
        address rewardMaster,
        address pantherPool,
        address zkpToken,
        address nftToken,
        uint32 rewardingStart,
        uint32 rewardedPeriod
    )
        AdvancedStakeRewardController(
            _owner,
            rewardMaster,
            pantherPool,
            zkpToken,
            nftToken,
            rewardingStart,
            rewardedPeriod
        )
    // solhint-disable-next-line no-empty-blocks
    {

    }

    function internalComputeZkpReward(
        uint256 stakeAmount,
        uint32 lockedTill,
        uint32 stakedAt
    ) external view returns (uint256 zkpAmount) {
        return _computeZkpReward(stakeAmount, lockedTill, stakedAt);
    }
}
