// SPDX-License-Identifier: MIT
/* solhint-disable not-rely-on-time */
pragma solidity 0.8.9;

import "./actions/RewardAdvisersList.sol";
import "./interfaces/IActionMsgReceiver.sol";
import "./interfaces/IRewardAdviser.sol";
import "./interfaces/IRewardPool.sol";
import "./utils/ImmutableOwnable.sol";
import "./utils/Claimable.sol";
import "./utils/NonReentrant.sol";
import "./utils/Utils.sol";

/***
 * @title RewardMaster
 * @notice It accounts rewards and distributes reward tokens to users.
 * @dev It withdraws the reward token from (or via) the "REWARD_POOL" contract,
 * and keeps tokens, aka "Treasury", on its balance until distribution.
 * It issues to users "shares" in the Treasury, or redeems shares, paying out
 * tokens from the Treasury to users, or on behalf of users, as follows.
 * It receives messages (calls) on "actions" to be rewarded from authorized
 * "ActionOracle" contracts.
 * On every "action" message received, it calls a "RewardAdviser" contract,
 * assigned for that ActionOracle and action type, which advices on how many
 * shares shall be created and to whom, or whose shares must be redeemed, and
 * where reward tokens shall be sent to.
 * The owner may add or remove addresses of ActionOracle`s and RewardAdviser`s.
 */
contract RewardMaster is
    ImmutableOwnable,
    Utils,
    Claimable,
    NonReentrant,
    RewardAdvisersList,
    IActionMsgReceiver
{
    /// @notice Token rewards are given in
    address public immutable REWARD_TOKEN;

    /// @notice RewardPool instance that vests the reward token
    address public immutable REWARD_POOL;

    /// @dev Block the contract deployed in
    uint256 public immutable START_BLOCK;

    /**
     * At any time, the amount of the reward token a user is entitled to is:
     *   tokenAmountEntitled = accumRewardPerShare * user.shares - user.offset
     *
     * This formula works since we update parameters as follows ...
     * - when a new reward token amount added to the Treasury:
     *   accumRewardPerShare += tokenAmountAdded / totalShares
     * - when new shares granted to a user:
     *   user.offset += sharesToCreate * accumRewardPerShare
     *   user.shares += sharesToCreate
     *   totalShares += sharesToCreate
     * - when shares redeemed to a user:
     *   redemptionRate = accumRewardPerShare - user.offset/user.shares
     *   user.offset -= user.offset/user.shares * sharesToRedeem
     *   user.shares -= sharesToRedeem
     *   totalShares -= sharesToRedeem
     *   tokenAmountPayable = redemptionRate * sharesToRedeem
     *
     * (Scaling omitted in formulas above for clarity.)
     */

    /// @dev Block when reward tokens were last time were vested in
    uint32 public lastVestedBlock;

    /// @notice Total number of unredeemed shares
    /// (it is supposed to not exceed 2**96)
    uint96 public totalShares;

    // see comments above for explanation
    uint128 public accumRewardPerShare;
    // `accumRewardPerShare` is scaled (up) with this factor
    uint256 private constant SCALE = 1e9;

    // see comments above for explanation
    struct UserRecord {
        uint96 shares;
        uint96 offset;
    }

    // Mapping from user address to UserRecord data
    mapping(address => UserRecord) public records;

    /// @dev Emitted when new shares granted to a user
    event SharesGranted(address indexed user, uint256 amount);
    /// @dev Emitted when shares of a user redeemed
    event SharesRedeemed(address indexed user, uint256 amount);
    /// @dev Emitted when new reward token amount vested to this contract
    event RewardAdded(uint256 reward);
    /// @dev Emitted when reward token amount paid to/for a user
    event RewardPaid(address indexed user, uint256 reward);

    constructor(
        address _rewardToken,
        address _rewardPool,
        address _owner
    ) ImmutableOwnable(_owner) {
        require(_rewardToken != address(0) && _rewardPool != address(0), "RM:E1");

        REWARD_TOKEN = _rewardToken;
        REWARD_POOL = _rewardPool;
        START_BLOCK = blockNow();
    }

    /// @notice Returns reward token amount entitled to the given user/account
    // This amount the account would get if shares would be redeemed now
    function entitled(address account) public view returns (uint256) {
        UserRecord memory rec = records[account];
        if (rec.shares == 0) return 0;

        // known contract, no reentrancy guard needed
        uint256 releasable = IRewardPool(REWARD_POOL).releasableAmount();
        uint256 _accumRewardPerShare = accumRewardPerShare;
        if (releasable != 0) {
            _accumRewardPerShare += (releasable * SCALE) / totalShares;
        }

        return _getRewardEntitled(rec, _accumRewardPerShare);
    }

    function onAction(byte4 action, bytes memory message) external override returns (bool success) {
        IRewardAdviser adviser = _getRewardAdviserOrRevert(msg.sender, action);
        IRewardAdviser.Advice advice = adviser.adviceReward(action, message);
        if (advice.sharesToCreate > 0) {
            _grantShares(advice.createSharesFor, advice.sharesToCreate);
        }
        if (advice.sharesToRedeem > 0) {
            _redeemShares(advice.redeemSharesFrom, advice.sharesToRedeem, advice.sendRewardTo);
        }
        return true;
    }

    /* ========== ONLY FOR OWNER FUNCTIONS ========== */

    /// @notice Adds a given "RewardAdviser" for given ActionOracle and action type
    /// @dev May be only called by the {OWNER}
    function addRewardAdviser(
        address oracle,
        bytes4 action,
        address adviser
    ) external onlyOwner {
        _addRewardAdviser(oracle, action, adviser);
    }

    /// @notice Remove "RewardAdviser" for given ActionOracle and action type
    /// @dev May be only called by the {OWNER}
    function removeRewardAdviser(address oracle, bytes4 action) external onlyOwner {
        _removeRewardAdviser(oracle, action);
    }

    /// @notice Withdraws accidentally sent token from this contract
    /// @dev May be only called by the {OWNER}
    function claimErc20(
        address claimedToken,
        address to,
        uint256 amount
    ) external onlyOwner nonReentrant {
        if (claimedToken == address(REWARD_TOKEN)) {
            // Not allowed if unclaimed shares remain
            require(totalShares == 0, "RM:E?");
        }
        _claimErc20(claimedToken, to, amount);
    }

    /* ========== INTERNAL & PRIVATE FUNCTIONS ========== */

    function _getRewardEntitled(UserRecord memory rec, uint256 _accumRewardPerShare)
        internal
        pure
        returns (uint256)
    {
        if (rec.shares == 0 || _accumRewardPerShare == 0) return 0;
        return
            rec.shares == 0
                ? 0
                : (uint256(rec.shares) * _accumRewardPerShare) / SCALE - uint256(rec.offset);
    }

    function _grantShares(address to, uint256 shares)
        internal
        nonZeroAmount(shares)
        nonZeroAddress(to)
    {
        uint256 _accumRewardPerShare = _triggerVesting();

        UserRecord memory rec = records[to];
        uint256 newOffset = uint256(rec.offset) + (shares * uint256(_accumRewardPerShare)) / SCALE;
        uint256 newShares = uint256(rec.shares) + shares;

        records[to] = UserRecord(safe96(newShares), safe96(offset));
        totalShares = safe96(uint256(totalShares) + shares);

        emit Minted(to, shares);
    }

    function _redeemShares(
        address from,
        uint256 shares,
        address to
    ) internal nonZeroAmount(shares) nonZeroAddress(from) nonZeroAddress(to) {
        UserRecord memory rec = records[from];
        require(rec.shares >= shares, "RM:E?");

        uint256 _accumRewardPerShare = _triggerVesting();
        uint256 reward = _getRewardEntitled(rec, _accumRewardPerShare);

        uint256 newShares = uint256(rec.shares) - shares;
        uint256 newOffset = 0;
        if (newShares != 0) {
            newOffset = (uint256(rec.offset) * shares) / uint256(rec.shares);
        }

        records[to] = UserRecord(safe96(newShares), safe96(offset));
        totalShares = safe96(uint256(totalShares) - shares);

        if (reward != 0) {
            // known contract - nether reentrancy guard nor safeTransfer required
            require(IErc20Min(REWARD_TOKEN).transfer(to, reward), "RM:E?");
            emit RewardPaid(to, reward);
        }
        emit SharesRedeemed(from, shares);
    }

    function _triggerVesting() internal returns (uint256 newAccumRewardPerShare) {
        uint32 _blockNow = safe32BlockNow();
        if (lastVestedBlock >= _blockNow) return;

        uint256 _totalShares = totalShares;
        require(_totalShares != 0, "RM: no shares to vest for");

        // known contract, no reentrancy guard needed
        uint256 newlyVested = IRewardPool(REWARD_POOL).vestRewards();
        newAccumRewardPerShare = 0;
        if (newlyVested != 0) {
            newAccumRewardPerShare =
                uint256(accumRewardPerShare) +
                (newlyVested * SCALE) /
                totalShares;
            accumRewardPerShare = safe128(newAccumRewardPerShare);
            emit RewardAdded(newlyVested);
        }
        lastVestedBlock = _blockNow;
    }

    /* ========== MODIFIERS ========== */

    modifier nonZeroAmount(uint256 amount) {
        require(amount > 0, "RM: zero amount provided");
        _;
    }

    modifier nonZeroAddress(address account) {
        require(account != address(0), "RM: zero address provided");
        _;
    }
}
