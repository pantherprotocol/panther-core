// SPDX-License-Identifier: BUSL-3.0
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
// solhint-disable var-name-mixedcase
// solhint-disable-next-line compiler-fixed, compiler-gt-0_8
// slither-disable-next-line solc-version
pragma solidity 0.8.4;

interface IArptHistory {
    function getScArptAt(uint32 timestamp)
        external
        view
        returns (uint256 scArpt);
}

interface IStakeRegister {
    function stakes(address _account, uint256 _stakeId)
        external
        view
        returns (Stake memory);

    function accountStakes(address _account)
        external
        view
        returns (Stake[] memory);
}

struct Stake {
    // index in the `Stake[]` array of `stakes`
    uint32 id;
    // defines Terms
    bytes4 stakeType;
    // time this stake was created at
    uint32 stakedAt;
    // time this stake can be claimed at
    uint32 lockedTill;
    // time this stake was claimed at (unclaimed if 0)
    uint32 claimedAt;
    // amount of tokens on this stake (assumed to be less 1e27)
    uint96 amount;
    // address stake voting power is delegated to
    address delegatee;
}

/**
 * @title StakesReporter
 * @notice It simplifies getting stakes and rewards info for the UI.
 * it calls the `Staking` contract for getting the stakes
 * and the `StakeRewardController` contract for calculating the rewards.
 * @dev the contract is expected to use the `StakeRewardController.sol`
 * and `Staking.sol` on Polygon as IArptHistory as IStakeRegister
 */
contract StakesReporter {
    IStakeRegister public immutable STAKE_REGISTER;
    IArptHistory public immutable ARPT_HISTORY;

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
