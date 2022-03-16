// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
// solhint-disable var-name-mixedcase
// solhint-disable-next-line compiler-fixed, compiler-gt-0_8
pragma solidity ^0.8.0;

import "./interfaces/IStakingTypes.sol";
import "./Staking.sol";
import "./StakeRewardController.sol";

contract StakesReporter is IStakingTypes {
    Staking public immutable STAKING;
    StakeRewardController public immutable STAKE_REWARD_CONTROLLER;

    uint256 private constant SCALE = 1e9;

    constructor(address _staking, address _stakeRewardController) {
        require(
            _staking != address(0) && _stakeRewardController != address(0),
            "StakesReporter: Zero address passed"
        );

        STAKING = Staking(_staking);
        STAKE_REWARD_CONTROLLER = StakeRewardController(_stakeRewardController);
    }

    function getStakesInfo(address _account)
        external
        view
        returns (Stake[] memory stakes, uint256[] memory unclaimedRewards)
    {
        stakes = STAKING.accountStakes(_account);

        uint256 unclaimedRewardsNum;

        for (uint256 i = 0; i < stakes.length; i++) {
            if (stakes[i].claimedAt == 0) {
                unclaimedRewardsNum++;
            }
        }

        uint256[] memory unclaimedRewardsArray = new uint256[](
            unclaimedRewardsNum
        );
        uint256 index;

        for (uint256 i = 0; i < stakes.length; i++) {
            if (stakes[i].claimedAt == 0) {
                unclaimedRewardsArray[index] = getUnclaimedRewards(
                    STAKE_REWARD_CONTROLLER.getScArptAt(uint32(0)),
                    STAKE_REWARD_CONTROLLER.getScArptAt(stakes[i].stakedAt),
                    stakes[i].amount
                );
                index++;
            }
        }

        unclaimedRewards = unclaimedRewardsArray;
    }

    function getStakeInfo(address _account, uint256 _stakeID)
        external
        view
        returns (Stake memory stake, uint256 unclaimedRewards)
    {
        (
            uint32 id,
            bytes4 stakeType,
            uint32 stakedAt,
            uint32 lockedTill,
            uint32 claimedAt,
            uint96 amount,
            address delegatee
        ) = STAKING.stakes(_account, _stakeID);

        stake = Stake(
            id,
            stakeType,
            stakedAt,
            lockedTill,
            claimedAt,
            amount,
            delegatee
        );

        if (claimedAt == 0)
            unclaimedRewards = getUnclaimedRewards(
                STAKE_REWARD_CONTROLLER.getScArptAt(uint32(0)),
                STAKE_REWARD_CONTROLLER.getScArptAt(stakedAt),
                amount
            );
    }

    function getUnclaimedRewards(
        uint256 _scArptFrom,
        uint256 _scArptTill,
        uint96 amount
    ) public pure returns (uint256) {
        return ((_scArptFrom - _scArptTill) * amount) / SCALE;
    }
}
