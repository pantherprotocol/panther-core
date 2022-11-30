// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;

import "../AdvancedStakeRewardController.sol";

contract MockAdvancedStakeRewardController is AdvancedStakeRewardController {
    constructor(
        address _owner,
        address rewardMaster,
        address pantherPool,
        address zkpToken,
        address nftToken
    )
        AdvancedStakeRewardController(
            _owner,
            rewardMaster,
            pantherPool,
            zkpToken,
            nftToken
        )
    // solhint-disable-next-line no-empty-blocks
    {

    }

    function internalComputeZkpReward(
        uint256 stakeAmount,
        uint32 lockedTill,
        uint32 stakedAt,
        RewardParams memory _rewardParams
    ) external pure returns (uint256 zkpAmount) {
        return
            _computeZkpReward(stakeAmount, lockedTill, stakedAt, _rewardParams);
    }

    function internalGenerateRewards(bytes calldata message) external {
        _generateRewards(message);
    }

    function internalGetUpdatedLimit(
        uint256 available,
        uint96 currentLimit,
        uint96 usedLimit
    ) external pure returns (bool isUpdated, uint96 limit) {
        return _getUpdatedLimit(available, currentLimit, usedLimit);
    }

    function fakeTotals(Totals memory _totals) external {
        totals = _totals;
    }
}
