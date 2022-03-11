// SPDX-License-Identifier: UNLICENSED
// solhint-disable-next-line compiler-fixed, compiler-gt-0_8
pragma solidity ^0.8.0;

import "./actions/StakingMsgProcessor.sol";
import "./interfaces/IRewardAdviser.sol";
import "./utils/Claimable.sol";
import "./utils/Utils.sol";

/**
 * @title StakeRewardController
 * @notice It accounts for and sends staking rewards to stakers
 * @dev It acts as the "RewardAdviser" for the "RewardMaster". The latter calls
 * this contract to process messages from the "Staking" contract.
 * It replaces the "StakeRewardAdviser" on Polygon.
 * It simulates "advise" of "StakeRewardAdviser" to the "RewardMaster"
 * For stakes created before the replacement (aka "old" stakes) it returns
 * modified "advices" with "old" amounts of rewards ("shares") but with the
 * address of the REWARD_TREASURY as the recipient of rewards. So the latest
 * gets "old" rewards which the "RewardMaster" pays on "advices".
 * For "new" stakes, it returns "advices" with zero rewards (zero "shares").
 * Note, it pays "new" rewards to stakers both under "old" and "new" stakes.
 */
contract StakeRewardController is
    StakingMsgProcessor,
    Utils,
    Claimable,
    IRewardAdviser
{
    /**
     * ARPT (Arpt, arpt) stands for "Accumulated amount of Rewards Per staked Token".
     *
     * Staking reward is calculated on redemption of a stake (`action == UNSTAKED`),
     * when we know `stakedAt`, `claimedAt` and `amount` of the stake.
     *
     * The amount to reward on every stake unstaked we compute as follows.
     *   appreciation = newArpt - arptHistory[stakedAt]      // See (2) and (3)
     *   rewardAmount = amount * appreciation                               (1)
     *
     * Each time when a stake is created (on "STAKED") or redeemed (on "UNSTAKED"),
     * we calculate and saves params as follows.
     *   timeNow = action == STAKED ? stakedAt : claimedAt
     *   rewardAdded = (timeNow - rewardUpdatedOn) * REWARD_PER_SECOND
     *   rewardPerTokenAdded = rewardAdded / totalStaked;
     *   newArpt = accumRewardPerToken + rewardPerTokenAdded                (2)
     *   accumRewardPerToken = newArpt
     *   storage rewardUpdatedOn = timeNow
     *   totalStaked = totalStaked + (action == STAKED ? +amount : -amount)
     *   if (action == STAKED) {
     *     arptHistory[timeNow] = newArpt                                   (3)
     *   }
     *
     * (Scaling omitted in formulas above for clarity)
     */

    // solhint-disable var-name-mixedcase

    /// @notice The ERC20 token to pay rewards in
    address public immutable REWARD_TOKEN;

    /// @notice Account that approves this contract as a spender of {REWARD_TOKEN} it holds
    address public immutable REWARD_TREASURY;

    /// @notice RewardMaster instance authorized to call `getRewardAdvice` on this contract
    address public immutable REWARD_MASTER;

    /// @notice Account authorized to initialize initial historical data
    address private immutable HISTORY_PROVIDER;

    // Params named with "sc" prefix are scaled (up) with this factor
    uint256 private constant SCALE = 1e9;

    /// @dev Amount of rewards accrued to the reward pool every second (scaled)
    uint256 private constant sc_REWARD_PER_SECOND = (2e24 * SCALE) / 56 days;

    bytes4 public STAKE_TYPE = 0x4ab0941a;
    bytes4 private immutable STAKED;
    bytes4 private immutable UNSTAKED;

    // "shares" for "old" stakes are scaled (down) with this factor
    uint256 private constant OLD_SHARE_FACTOR = 1e6;

    // solhint-enable var-name-mixedcase

    uint32 public prefilledHistoryEnd;
    uint32 public activeSince;

    uint256 public scAccumRewardPerToken;
    uint96 public totalRewardAccrued;
    uint32 public rewardUpdatedOn;

    uint96 public totalStaked;

    /// @notice Mapping from `stakedAt` to "Accumulated Reward amount Per Token staked" (scaled)
    /// @dev We pre-populate "old" stakes data, then "STAKED" calls append new stakes
    mapping(uint256 => uint256) public scArptHistory;

    /// @dev Emitted when new reward amount counted in `totalRewardAccrued`
    event RewardAdded(uint256 reward);
    /// @dev Emitted when reward paid to a staker
    event RewardPaid(address indexed staker, uint256 reward);

    function saveHistoricalData(
        uint256[] calldata accumRewards,
        uint256[] calldata timestamps
    ) external onlyDeployer onlyOnce;

    constructor(
        address token,
        address rewardTreasury,
        address rewardMaster,
        address historyProvider
    ) {
        STAKED = _encodeStakeActionType(STAKE_TYPE);
        UNSTAKED = _encodeUnstakeActionType(STAKE_TYPE);

        require(
            token != address(0) &&
                rewardTreasury != address(0) &&
                rewardMaster != address(0) &&
                historyProvider != address(0),
            "SRC: E1"
        );

        REWARD_TOKEN = token;
        REWARD_TREASURY = rewardTreasury;
        REWARD_MASTER = rewardMaster;
        HISTORY_PROVIDER = historyProvider;
    }

    function isInitialized() public view returns (bool) {
        return prefilledHistoryEnd != 0;
    }

    function getRewardAdvice(bytes4 action, bytes memory message)
        external
        view
        override
        returns (Advice memory)
    {
        require(msg.sender == REWARD_MASTER, "SRC: unauthorized");

        (
            address staker,
            uint96 stakeAmount, // uint32 id
            ,
            uint32 stakedAt, // uint32 lockedTill
            ,
            uint32 claimedAt, // bytes memory data
            ,

        ) = _unpackStakingActionMsg(message);

        require(staker != address(0), "SRC: unexpected zero staker");
        require(amount != 0, "SRC: unexpected zero amount");
        require(stakedAt != 0, "SRC: unexpected zero stakedAt");
        require(claimedAt <= safe32TimeNow(), "SRC: claimedAt not yet come");
        require(
            action != UNSTAKED || claimedAt >= stakedAt,
            "SRC: unexpected claimedAt"
        );

        if (stakedAt < activeSince) {
            require(action == UNSTAKED, "SRC: invalid 'old' action");
            _countUnstakeAndPayReward(staker, stakeAmount, stakedAt, claimedAt);
            return _getUnstakeModifiedAdvice(staker, amount);
        }

        if (action == STAKED) {
            _countNewStake(stakeAmount, stakedAt);
            return _getStakeVoidAdvice(staker);
        }

        if (action == UNSTAKED) {
            _countUnstakeAndPayReward(staker, stakeAmount, stakedAt, claimedAt);
            return _getUnstakeVoidAdvice(staker);
        }

        revert("SRC: unsupported action");
    }

    /// @notice Withdraws accidentally sent token from this contract
    /// @dev May be only called by the {OWNER}
    function claimErc20(
        address claimedToken,
        address to,
        uint256 amount
    ) external onlyOwner nonReentrant {
        _claimErc20(claimedToken, to, amount);
    }

    function _countNewStake(uint96 stakeAmount, uint32 stakedAt) internal {
        uint256 _scArpt = _updateRewardPoolParams(stakedAt);
        if (scArptHistory[stakedAt] == 0) {
            scArptHistory[stakedAt] = _scArpt;
        }
        totalStaked = safe96(uint256(totalStaked) + uint256(stakeAmount));
    }

    function _countUnstakeAndPayReward(
        address staker,
        uint96 stakeAmount,
        uint32 stakedAt,
        uint32 claimedAt
    ) internal {
        uint256 startScArpt = _getHistoricalArpt(stakedAt);

        uint256 endScArpt = _updateRewardPoolParams(claimedAt);
        uint256 reward = _countReward(stakeAmount, startScArpt, endScArpt);

        totalStaked = safe96(uint256(totalStaked) - uint256(stakeAmount));

        if (reward != 0) {
            // trusted contract - nether reentrancy guard nor safeTransfer required
            require(
                IErc20Min(REWARD_TOKEN).transfer(staker, reward),
                "SRC: Internal transfer failed"
            );
            emit RewardPaid(staker, reward);
        }
    }

    function _updateRewardPoolParams(uint32 validAt)
        internal
        returns (uint256 newScArpt)
    {
        newScArpt = scAccumRewardPerToken;
        uint32 prevValidAt = rewardUpdatedOn;
        if (prevValidAt >= validAt) return newScArpt;

        uint256 rewardAdded;
        (newScArpt, rewardAdded) = _computeRewardsAddition(
            newScArpt,
            validAt,
            prevValidAt,
            totalStaked
        );
        scAccumRewardPerToken = newScArpt;
        totalRewardAccrued = safe96(uint256(totalRewardAccrued) + rewardAdded);
        rewardUpdatedOn = validAt;

        emit RewardAdded(rewardAdded);
    }

    function _computeRewardsAddition(
        uint256 prevScArpt,
        uint32 validAt,
        uint32 prevValidAt,
        uint256 _totalStaked
    ) internal pure returns (uint256 newScArpt, uint256 rewardAdded) {
        uint256 scRewardAdded = (validAt - prevValidAt) * sc_REWARD_PER_SECOND;
        rewardAdded = scRewardAdded / SCALE;
        newScArpt = prevScArpt + scRewardAdded / _totalStaked;
    }

    function _getHistoricalArpt(uint32 stakedAt)
        internal
        view
        returns (uint256 scArpt)
    {
        scArpt = scArptHistory[stakedAt];
        if (scArpt > 0) return scArpt;

        // Stake created within a period this contract has no stake data for ?
        bool isBlindPeriodStake = stakedAt > prefilledHistoryEnd &&
            stakedAt < activeSince;
        if (isBlindPeriodStake) {
            // approximate
            scArpt = scArptHistory[activeSince];
        }

        require(scArpt > 0, "SRC: unknown Arptsu for stakedAt");
    }

    function _countReward(
        uint96 stakeAmount,
        uint256 startScArpt,
        uint256 endScArpt
    ) internal pure returns (uint256 reward) {
        reward = ((endScArpt - startScArpt) * uint256(stakeAmount)) / SCALE;
    }

    function _getStakeVoidAdvice(address staker)
        internal
        returns (Advice memory advice)
    {
        advice = _getEmptyAdvice();
        advice.createSharesFor = staker;
    }

    function _getUnstakeVoidAdvice(address staker)
        internal
        returns (Advice memory advice)
    {
        advice = _getEmptyAdvice();
        advice.redeemSharesFrom = staker;
    }

    function _getUnstakeModifiedAdvice(address staker, uint96 amount)
        internal
        returns (Advice memory advice)
    {
        advice = _getEmptyAdvice();
        advice.redeemSharesFrom = staker;
        advice.sharesToRedeem = safe96(uint256(amount) / OLD_SHARE_FACTOR);
    }

    function _getEmptyAdvice() internal pure returns (Advice memory advice) {
        advice = Advice(
            address(0), // createSharesFor
            0, // sharesToCreate
            address(0), // redeemSharesFrom
            0, // sharesToRedeem
            REWARD_TREASURY // sendRewardTo
        );
    }
}
