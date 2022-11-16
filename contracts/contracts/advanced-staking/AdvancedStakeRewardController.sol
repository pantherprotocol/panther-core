// SPDX-License-Identifier: UNLICENSED
// solhint-disable-next-line compiler-fixed, compiler-gt-0_8
pragma solidity ^0.8.0;

import "./actions/AdvancedStakingDataDecoder.sol";
import "./actions/Constants.sol";
import "./actions/StakingMsgProcessor.sol";
import "./interfaces/IERC721Receiver.sol";
import "./interfaces/INftGrantor.sol";
import "./interfaces/IPantherPoolV0.sol";
import "./interfaces/IRewardAdviser.sol";
import "../common/Claimable.sol";
import "../common/ImmutableOwnable.sol";
import "../common/NonReentrant.sol";
import "../common/Utils.sol";
import "../common/TransferHelper.sol";

/**
 * @title AdvancedStakeRewardController
 * @notice It generates UTXOs in the MASP as rewards to stakers for the "Advanced Staking"
 * @dev This contract is supposed to run on the Polygon. Unless otherwise mentioned, other smart
 * contracts are supposed to run on the Polygon also.
 * As the "Reward Adviser" on the "advanced" stakes, every time a new stake is being created, it
 * receives the `getRewardAdvice` call from the `RewardMaster` contract with the `STAKE` action
 * type and the stake data (the `message`) being the call parameters.
 * On the `getRewardAdvice` call received, this contract:
 * - computes the amounts of the $ZKP reward and the optional NFT reward
 * - if the `NFT_TOKEN` is non-zero address, it calls `grantOneToken` on the NFT_TOKEN, and gets
 * the `tokenId` of the minted NFT token
 * - calls `generateDeposits` of the PantherPoolV0, providing amounts/parameters of $ZKP, and
 *   optional NFT as "deposits", as well as "spending pubKeys" and "secrets" (explained below)
 * - returns the "zero reward advice" (with zero `sharesToCreate`) to the RewardMaster.
 *
 * On the "zero" advice, the RewardMaster skips creating "treasure shares" for the staker. This way
 * rewarding gets orchestrated by this contract rather than the RewardMaster.
 *
 * Being called `generateDeposits`, the PantherPoolV0:
 * - requests the `Vault` to take (`transferFrom`) the $ZKP and NFT tokens from this contract
 * - generates "UTXOs" with the "spending pubKeys" and "secrets" provided (see bellow).
 *
 * Creating a new stake (i.e. calling the `stake`), the staker generates and provides the "pubKeys"
 * and "secrets" to the Staking. Both the Staking on the mainnet and the Staking on the Polygon
 * encodes them into the STAKE message and passes to the RewardMaster, which passes the message to
 * this contract with the `getRewardAdvice` call. So this contracts get pubKeys and secrets needed
 * for the `generateDeposits`.
 * For stakes on the Polygon, when all contracts (i.e. Staking, RewardMaster and this contract) run
 * on the same network, the RewardMaster on the Polygon calls this contract directly.
 * For stakes made on the mainnet, where the Staking and the RewardMaster run, but this contract is
 * on the Polygon, the RewardMaster on the mainnet sends the STAKE message to the RewardMaster on
 * the Polygon via the PoS bridge and mediator contracts. The RewardMaster on the Polygon handles a
 * bridged STAKE message (calling the `getRewardAdvice`) as if the message had been sent by the
 * Staking on the Polygon.
 *
 * As a prerequisite:
 * - this contract shall:
 * -- be authorized as the "RewardAdviser" with the RewardMaster on the Polygon for advanced stakes
 * -- be authorized as "Minter" (aka "grantor") with the NFT_TOKEN contract
 * -- hold enough $ZKP to reward stakers
 * - the Vault contract shall be approved to transfer $ZKPs and the NFT tokens from this contract
 * - the $ZKP and the NFT tokens shall be registered as zAssets on the PantherPoolV0.
 */
contract AdvancedStakeRewardController is
    ImmutableOwnable,
    NonReentrant,
    StakingMsgProcessor,
    AdvancedStakingDataDecoder,
    Utils,
    Claimable,
    IERC721Receiver,
    IRewardAdviser
{
    using TransferHelper for address;

    /// @dev Total amount of $ZKP and NFTs (ever) rewarded and staked
    struct Totals {
        uint96 zkpRewards;
        uint24 nftRewards;
        // Accumulated amount of $ZKP (ever) staked, scaled (divided) by 1e15
        uint40 scZkpStaked;
    }

    /// @dev Maximum amounts of $ZKPs and NFTs which may be rewarded
    struct Limits {
        uint96 zkpRewards;
        uint24 nftRewards;
    }

    /// @dev Reward Timestamps and APYs
    struct RewardParams {
        /// @param (UNIX) Time when $ZKP rewards start to accrue
        uint32 startTime;
        /// @param (UNIX) Time when $ZKP rewards accruals end
        uint32 endTime;
        /// @param $ZKP reward APY at startTime (APY declines from this value)
        uint8 startZkpApy;
        /// @param $ZKP reward APY at endTime (APY declines to this value)
        uint8 endZkpApy;
    }

    // solhint-disable var-name-mixedcase
    // These three constants used to align with IPantherPool::generateDeposits API
    uint256 private constant ZERO_AMOUNT = 0;
    uint256 private constant ZERO_TOKEN_ID = 0;
    address private constant ZERO_TOKEN = address(0);

    /// @notice RewardMaster contract instance
    address public immutable REWARD_MASTER;
    /// @notice PantherPoolV0 contract instance
    address public immutable PANTHER_POOL;

    // Address of the $ZKP token contract
    address private immutable ZKP_TOKEN;
    // Address of the NFT token contract
    address private immutable NFT_TOKEN;

    /// @notice Block when this contract is deployed
    uint256 public immutable START_BLOCK;

    // solhint-enable var-name-mixedcase

    /// @notice Amounts of $ZKP and NFT allocated for rewards
    Limits public limits;

    /// @notice Total amounts of $ZKP and NFT rewarded so far
    Totals public totals;

    /// @notice Reward parameters (start and end point for time and APY)
    RewardParams public rewardParams;

    /// @dev Emitted when new amounts are allocated to reward stakers
    event RewardLimitUpdated(Limits newLimits);

    /// @dev Emitted when rewarding params updated
    event RewardParamsUpdated(RewardParams newRewardParams);

    /// @dev Emitted when the reward for a stake is generated
    event RewardGenerated(
        address indexed staker,
        uint256 firstLeafId,
        uint256 zkp,
        uint256 nft
    );

    constructor(
        address _owner,
        address rewardMaster,
        address pantherPool,
        address zkpToken,
        address nftToken
    ) ImmutableOwnable(_owner) {
        require(
            // nftToken may be zero address
            rewardMaster != address(0) &&
                pantherPool != address(0) &&
                zkpToken != address(0),
            "ARC:E1"
        );

        REWARD_MASTER = rewardMaster;
        PANTHER_POOL = pantherPool;

        ZKP_TOKEN = zkpToken;
        NFT_TOKEN = nftToken;

        START_BLOCK = block.number;
    }

    /// @dev To be called by the {RewardMaster} contract on "advanced" `STAKE` and `UNSTAKE` actions.
    /// The caller is trusted to never call w/ the STAKE acton:
    /// - twice for the same stake
    /// - after the rewarded period has ended
    function getRewardAdvice(bytes4 action, bytes memory message)
        external
        override
        returns (Advice memory)
    {
        require(msg.sender == REWARD_MASTER, "ARC: unauthorized");

        if (action == ADVANCED_STAKE) {
            _generateRewards(message);
        } else {
            require(action == ADVANCED_UNSTAKE, "ARC: unsupported action");
        }

        // Return "zero" advice
        return
            Advice(
                address(0), // createSharesFor
                0, // sharesToCreate
                address(0), // redeemSharesFrom
                0, // sharesToRedeem
                address(0) // sendRewardTo
            );
    }

    /// @notice Return the APY for the $ZKP reward at a given time
    function getZkpApyAt(uint256 time) external view returns (uint256) {
        RewardParams memory _rewardParams = rewardParams;
        if (time < _rewardParams.startTime || time > _rewardParams.endTime)
            return 0;

        return _getZkpApyWithinRewardedPeriod(_rewardParams, time);
    }

    function updateRewardParams(RewardParams memory _newParams)
        external
        onlyOwner
    {
        require(
            _newParams.startTime != 0 &&
                _newParams.endTime > _newParams.startTime &&
                _newParams.endTime > timeNow(),
            "ARC: invalid time"
        );
        require(
            _newParams.startZkpApy >= _newParams.endZkpApy,
            "ARC: invalid APY"
        );

        rewardParams = _newParams;
        emit RewardParamsUpdated(_newParams);
    }

    /// @notice Allocate NFT rewards and approve the Vault to transfer them
    /// @dev Only owner may call it.
    function setNftRewardLimit(uint256 _desiredNftRewardsLimit)
        external
        onlyOwner
    {
        if (NFT_TOKEN == address(0)) return;

        Limits memory _limits = limits;

        require(
            _desiredNftRewardsLimit > totals.nftRewards,
            "ARC: low nft rewards limit"
        );

        // known contract - no reentrancy guard needed
        // slither-disable-next-line reentrancy-benign,reentrancy-no-eth,reentrancy-events
        address vault = IPantherPoolV0(PANTHER_POOL).VAULT();

        bool isUpdated = _updateNftRewardsLimitAndAllowance(
            _desiredNftRewardsLimit,
            _limits,
            totals,
            vault
        );

        if (isUpdated) {
            limits = _limits;
            emit RewardLimitUpdated(_limits);
        }
    }

    /// @notice Allocate for rewards the entire $ZKP balance
    /// this contract has and approve the Vault to transfer $ZKP from this contract.
    /// @dev Anyone may call it.
    function updateZkpRewardsLimit() external {
        Limits memory _limits = limits;
        // known contract call - no reentrancy guard needed
        // slither-disable-next-line reentrancy-benign,reentrancy-events
        address vault = IPantherPoolV0(PANTHER_POOL).VAULT();

        // Updating the rewards limits
        bool isUpdated = _updateZkpRewardsLimitAndAllowance(
            _limits,
            totals,
            vault
        );

        if (isUpdated) {
            limits = _limits;
            emit RewardLimitUpdated(_limits);
        }
    }

    /// @notice Withdraws unclaimed rewards or accidentally sent token from this contract
    /// @dev May be only called by the {OWNER}
    function rescueErc20(
        address token,
        address to,
        uint256 amount
    ) external nonReentrant {
        RewardParams memory _rewardParams = rewardParams;

        require(OWNER == msg.sender, "ARC: unauthorized");
        require(
            (token != ZKP_TOKEN) || (block.timestamp > _rewardParams.endTime),
            "ARC: too early withdrawal"
        );

        _claimErc20(token, to, amount);
    }

    // Implementation of the {IERC721Receiver}. It accepts NFT_TOKEN transfers only.
    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) external view override returns (bytes4) {
        return
            msg.sender == NFT_TOKEN
                ? this.onERC721Received.selector // accepted
                : bytes4(0); // rejected
    }

    // Private functions follow
    // Some of them declared `internal` rather than `private` to ease testing

    function _generateRewards(bytes memory message) internal {
        // (stakeId and claimedAt are irrelevant)
        (
            address staker,
            uint96 stakeAmount,
            ,
            uint32 stakedAt,
            uint32 lockedTill,
            ,
            bytes memory data
        ) = _unpackStakingActionMsg(message);

        require(stakeAmount != 0, "ARC: unexpected zero stakeAmount");
        require(lockedTill > stakedAt, "ARC: unexpected lockedTill");

        uint256 zkpAmount = 0;
        uint256 nftAmount = 0;
        uint256 nftTokenId = 0;
        {
            Totals memory _totals = totals;
            Limits memory _limits = limits;
            RewardParams memory _rewardParams = rewardParams;

            // Compute amount of the $ZKP reward  and check the limit
            {
                zkpAmount = _computeZkpReward(
                    stakeAmount,
                    lockedTill,
                    stakedAt,
                    _rewardParams
                );

                if (zkpAmount > 0) {
                    uint256 newTotalZkpReward = uint256(_totals.zkpRewards) +
                        zkpAmount;
                    require(
                        _limits.zkpRewards >= newTotalZkpReward,
                        "ARC: too less rewards available"
                    );
                    // Can't exceed uint96 here due to the `require` above
                    _totals.zkpRewards = uint96(newTotalZkpReward);
                }
                // update scSkpStaked in any case when stakeAmount > 0 which already been required
                uint256 newScZkpStaked = uint256(_totals.scZkpStaked) +
                    uint256(stakeAmount) /
                    1e15;
                // Overflow risk ignored as $ZKP max total supply is 1e9 tokens
                _totals.scZkpStaked = uint40(newScZkpStaked);
            }

            if (_totals.nftRewards < _limits.nftRewards) {
                // `_limits.nftRewards > 0` therefore `NFT_TOKEN != address(0)`
                // trusted contract called - no reentrancy guard needed
                // slither-disable-next-line reentrancy-benign,reentrancy-no-eth
                nftTokenId = INftGrantor(NFT_TOKEN).grantOneToken(
                    address(this)
                );

                nftAmount = 1;
                _totals.nftRewards += 1;
            }

            totals = _totals;
        }

        // Extract public spending keys and "secrets"
        (
            G1Point[OUT_RWRD_UTXOs] memory pubSpendingKeys,
            uint256[CIPHERTEXT1_WORDS][OUT_RWRD_UTXOs] memory secrets
        ) = unpackStakingData(data);

        // Finally, generate deposits (i.e. UTXOs in the MASP)
        address[OUT_MAX_UTXOs] memory tokens = [
            // PantherPool reverts if non-zero address provided for zero amount
            zkpAmount == 0 ? address(0) : ZKP_TOKEN,
            nftAmount == 0 ? address(0) : NFT_TOKEN,
            ZERO_TOKEN
        ];

        uint256[OUT_MAX_UTXOs] memory subIds = [0, nftTokenId, ZERO_TOKEN_ID];
        uint256[OUT_MAX_UTXOs] memory extAmounts = [
            zkpAmount,
            nftAmount,
            ZERO_AMOUNT
        ];

        uint32 createdAt = safe32TimeNow();
        // known contract call - no reentrancy guard needed
        // slither-disable-next-line reentrancy-benign,reentrancy-events
        uint256 leftLeafId = IPantherPoolV0(PANTHER_POOL).generateDeposits(
            tokens,
            subIds,
            extAmounts,
            [
                pubSpendingKeys[0],
                pubSpendingKeys[1],
                pubSpendingKeys[1] // dummy public key - reused
            ],
            [
                secrets[0],
                secrets[1],
                secrets[1] // dummy secret - reused
            ],
            createdAt
        );

        emit RewardGenerated(staker, leftLeafId, zkpAmount, nftAmount);
    }

    // The calling code is assumed to ensure `lockedTill > stakedAt`
    function _computeZkpReward(
        uint256 stakeAmount,
        uint256 lockedTill,
        uint256 stakedAt,
        RewardParams memory _rewardParams
    ) internal pure returns (uint256 zkpAmount) {
        // No rewarding after `endTime`
        if (stakedAt >= _rewardParams.endTime) return 0;
        // No rewarding before `startTime`
        if (lockedTill <= _rewardParams.startTime) return 0;

        uint256 rewardedSince = _rewardParams.startTime > stakedAt
            ? _rewardParams.startTime
            : stakedAt;

        uint256 rewardedTill = lockedTill > _rewardParams.endTime
            ? _rewardParams.endTime
            : lockedTill;

        uint256 period = rewardedTill - rewardedSince;
        uint256 apy = _getZkpApyWithinRewardedPeriod(
            _rewardParams,
            rewardedSince
        );

        // 3153600000 = 365 * 24 * 3600 seconds * 100 percents
        // slither-disable-next-line too-many-digits
        zkpAmount = (stakeAmount * apy * period) / 3153600000;
        // round to 2nd digits after decimal point: X.YZ{0..0} x 1e18
        unchecked {
            // rounding (accuracy loss is assumed)
            // slither-disable-next-line divide-before-multiply
            zkpAmount = (zkpAmount / 1e16) * (1e16);
        }
    }

    // The calling code is assumed to ensure that
    // `startTime < time < endTime` and `startZkpApy >= endZkpApy`
    function _getZkpApyWithinRewardedPeriod(
        RewardParams memory _rewardParams,
        uint256 time
    ) private pure returns (uint256 apy) {
        unchecked {
            uint256 fullDrop = uint256(
                _rewardParams.startZkpApy - _rewardParams.endZkpApy
            );
            apy = uint256(_rewardParams.startZkpApy);

            if (fullDrop > 0) {
                uint256 dropDuration = time - _rewardParams.startTime;
                uint256 fullDuration = uint256(
                    _rewardParams.endTime - _rewardParams.startTime
                );
                uint256 apyDrop = (fullDrop * dropDuration) / fullDuration;

                apy -= apyDrop;
            }
        }
    }

    // Allocate for rewards the entire $ZKP balance this contract holds,
    // and update allowance for the VAULT to spend for $ZKP from the balance
    function _updateZkpRewardsLimitAndAllowance(
        Limits memory _limits,
        Totals memory _totals,
        address vault
    ) private returns (bool isUpdated) {
        // Reentrancy guard unneeded for the trusted contract call
        // slither-disable-next-line reentrancy-benign,reentrancy-events,reentrancy-no-eth
        uint256 balance = ZKP_TOKEN.safeBalanceOf(address(this));

        uint96 newLimit;
        (isUpdated, newLimit) = _getUpdatedLimit(
            balance,
            _limits.zkpRewards,
            _totals.zkpRewards
        );

        if (isUpdated) {
            _limits.zkpRewards = newLimit;

            // Approve the vault to transfer tokens from this contract
            // Reentrancy guard unneeded for the trusted contract call
            // slither-disable-next-line reentrancy-benign,reentrancy-events,reentrancy-no-eth
            ZKP_TOKEN.safeApprove(vault, uint256(newLimit));
        }
    }

    // Allocate for rewards the entire NFT amount this contract can mint,
    // and update allowance for the VAULT to spend that NFT
    function _updateNftRewardsLimitAndAllowance(
        uint256 _desiredNftRewardsLimit,
        Limits memory _limits,
        Totals memory _totals,
        address vault
    ) private returns (bool isUpdated) {
        uint96 newLimit;
        (isUpdated, newLimit) = _getUpdatedLimit(
            _desiredNftRewardsLimit,
            _limits.nftRewards,
            _totals.nftRewards
        );

        if (isUpdated) {
            bool isAllowanceToBeUpdated = _limits.nftRewards == 0;

            // Overflow is unrealistic and therefore ignored
            _limits.nftRewards = uint24(newLimit);

            if (isAllowanceToBeUpdated)
                // Approve the vault to transfer tokens from this contract
                // Reentrancy guard unneeded for the trusted contract call
                // slither-disable-next-line reentrancy-benign,reentrancy-no-eth,reentrancy-events
                NFT_TOKEN.safeSetApprovalForAll(vault, true);
        }
    }

    // Calculates and returns the updated reward limit
    function _getUpdatedLimit(
        uint256 available,
        uint96 currentLimit,
        uint96 usedLimit
    ) internal pure returns (bool isUpdated, uint96 limit) {
        uint256 unusedLimit = uint256(currentLimit) - uint256(usedLimit);

        if (available == unusedLimit) return (false, currentLimit);

        isUpdated = true;
        // underflow is impossible due to `if` checks
        unchecked {
            if (available > unusedLimit) {
                // new tokens for rewarding have been provided
                uint256 newAllocation = available - unusedLimit;
                limit = safe96(newAllocation + currentLimit);
            } else {
                // gracefully handle this unexpected situation
                uint96 shortage = safe96(unusedLimit - available);
                limit = currentLimit > shortage ? currentLimit - shortage : 0;
            }
        }
    }
}
