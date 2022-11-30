// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
// slither-disable-next-line solc-version
pragma solidity 0.8.4;

import "./interfaces/IStakingTypes.sol";
import "./interfaces/IStakeRegister.sol";
import "./interfaces/IArptHistory.sol";

/**
 * @title StakesReporter
 * @notice It simplifies getting stakes and rewards info for the UI.
 * it calls the `Staking` contract for getting the stakes
 * and the `StakeRewardController` contract for calculating the rewards.
 * @dev the contract is expected to use the `StakeRewardController.sol`
 * and `Staking.sol` on Polygon as IArptHistory and IStakeRegister
 */
contract StakesReporter is IStakingTypes {
    // solhint-disable var-name-mixedcase
    IStakeRegister public immutable STAKE_REGISTER;
    IArptHistory public immutable ARPT_HISTORY;
    // solhint-enable var-name-mixedcase

    uint256 private constant SCALE = 1e9;

    constructor(address _staking, address _stakeRewardController) {
        require(
            _staking != address(0) && _stakeRewardController != address(0),
            "StakesReporter: Zero address passed"
        );

        STAKE_REGISTER = IStakeRegister(_staking);
        ARPT_HISTORY = IArptHistory(_stakeRewardController);
    }

    function getStakesInfo(address _account)
        external
        view
        returns (Stake[] memory, uint256[] memory)
    {
        // trusted contract call - no reentrancy guard needed
        Stake[] memory stakes = STAKE_REGISTER.accountStakes(_account);

        uint256[] memory unclaimedRewards = new uint256[](stakes.length);

        for (uint256 i = 0; i < stakes.length; ) {
            // The next call can't trigger the "calls loop" since it triggers
            // external calls to a trusted contract only.
            // Slither's "disable calls-loop detector" directive is inserted in
            // the external call line rather than here (since otherwise slither
            // reports false-positive issues).
            unclaimedRewards[i] = getUnclaimedRewards(stakes[i]);

            unchecked {
                ++i;
            }
        }

        return (stakes, unclaimedRewards);
    }

    function getStakeInfo(address _account, uint256 _stakeID)
        external
        view
        returns (Stake memory, uint256)
    {
        Stake memory stake = STAKE_REGISTER.stakes(_account, _stakeID);

        uint256 unclaimedRewards = getUnclaimedRewards(stake);

        return (stake, unclaimedRewards);
    }

    function getRewards(
        uint256 _scArptFrom,
        uint256 _scArptTill,
        uint96 amount
    ) public pure returns (uint256) {
        return ((_scArptTill - _scArptFrom) * amount) / SCALE;
    }

    function getUnclaimedRewards(Stake memory stake)
        internal
        view
        returns (uint256)
    {
        uint256 unclaimedRewards = 0;

        if (stake.claimedAt == 0)
            // note comments to "calls-loop" in `function getStakesInfo`
            // slither-disable-next-line calls-loop
            unclaimedRewards = getRewards(
                // trusted contract call - no reentrancy guard needed
                ARPT_HISTORY.getScArptAt(stake.stakedAt),
                ARPT_HISTORY.getScArptAt(uint32(0)),
                stake.amount
            );

        return unclaimedRewards;
    }
}
