// SPDX-License-Identifier: UNLICENSED
// solhint-disable-next-line compiler-fixed, compiler-gt-0_8
pragma solidity ^0.8.0;

import "./actions/AdvancedStakingDataDecoder.sol";
import "./actions/Constants.sol";
import "./actions/StakingMsgProcessor.sol";
import { PRP_VIRTUAL_CONTRACT } from "./common/Constants.sol";
import "./interfaces/IERC721Receiver.sol";
import "./interfaces/INftGrantor.sol";
import "./interfaces/IPantherPoolV0.sol";
import "./interfaces/IRewardAdviser.sol";
import "./utils/Claimable.sol";
import "./utils/ImmutableOwnable.sol";
import "./utils/NonReentrant.sol";
import "./utils/Utils.sol";
import "./common/TransferHelper.sol";

/**
 * @title AdvancedStakeRewardController
 * @notice It generates UTXOs in the MASP as rewards to stakers for the "Advanced Staking"
 * @dev This contract is supposed to run on the Polygon. Unless otherwise mentioned, other smart
 * contracts are supposed to run on the Polygon also.
 * As the "Reward Adviser" on the "advanced" stakes, every time a new stake is being created, it
 * receives the `getRewardAdvice` call from the `RewardMaster` contract with the `STAKE` action
 * type and the stake data (the `message`) being the call parameters.
 * On the `getRewardAdvice` call received, this contract:
 * - computes the amount of the $ZKP reward to the staker
 * - calls `generateDeposits` of the PantherPoolV0, providing amounts/parameters of $ZKP, PRP, and
 *   optional NFT as "deposits", as well as "spending pubKeys" and "secrets" (explained below)
 * - returns the "zero reward advice" (with zero `sharesToCreate`) to the RewardMaster.
 *
 * On the "zero" advice, the RewardMaster skips creating "treasure shares" for the staker. This way
 * rewarding gets orchestrated by this contract rather than the RewardMaster.
 *
 * Being called `generateDeposits`, the PantherPoolV0:
 * - requests the `Vault` to take (`transferFrom`) the $ZKP and NFT tokens from this contract
 * - "burns" the PRP grant
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
 * - this contract shall be authorized as:
 * -- "RewardAdviser" with the RewardMaster on Polygon for advanced stakes
 * - this contract shall hold enough $ZKP balance to reward stakers
 * - this contract may hold enough NFT tokens to reward stakers
 * - this contract shall be granted enough $PRP balance to reward stakers
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

    /// @dev Total amount of $ZKPs, PRPd and NFTs (ever) rewarded and staked
    struct Totals {
        uint96 zkpRewards;
        uint96 prpRewards;
        uint24 nftRewards;
        // Accumulated amount of $ZKP (ever) staked, scaled (divided) by 1e15
        uint40 scZkpStaked;
    }

    // solhint-disable var-name-mixedcase

    /// @notice RewardMaster contract instance
    address public immutable REWARD_MASTER;
    /// @notice PantherPoolV0 contract instance
    address public immutable PANTHER_POOL;
    /// @notice PrpGrantor contract instance
    address private immutable PRP_GRANTOR;

    // Address of the $ZKP token contract
    address private immutable ZKP_TOKEN;
    // Address of the NFT token contract
    address private immutable NFT_TOKEN;

    /// @notice Amount of PRPs allocated per Stake
    uint256 public immutable PRP_REWARD_PER_STAKE;

    /// @notice (UNIX) Time when staking rewards start to accrue
    uint256 public immutable REWARDING_START;
    // Period (seconds since REWARDING_START) when stakes are rewarded
    // (this period shall not yet be in the past on the contract deployment)
    uint256 private immutable REWARDED_PERIOD;
    /// @notice (UNIX) Time when staking rewards accruals end
    uint256 public immutable REWARDING_END;

    // $ZKP APY at REWARDING_START (the APY declines from this value)
    uint256 private constant START_ZKP_APY = 70;
    // $ZKP APY at the end of (and after) the REWARDED_PERIOD
    // (the APY declines to this value)
    uint256 private constant FINAL_ZKP_APY = 40;
    // $ZKP APY drop (scaled by 1e9) per second of REWARDED_PERIOD
    uint256 private immutable sc_ZKP_APY_PER_SECOND_DROP;

    uint256 private constant ZKP_RESCUE_FORBIDDEN_PERIOD = 90 days;

    /// @notice Block when this contract is deployed
    uint256 public immutable START_BLOCK;

    // solhint-enable var-name-mixedcase

    /// @notice Amount of $ZKPs allocated for rewards
    uint256 public zkpRewardsLimit;

    /// @notice Amount of PRPs allocated for rewards
    uint128 public prpRewardsLimit;

    /// @notice Amount of PRPs allocated for rewards
    uint128 public nftRewardsLimit;

    /// @notice Total amounts of $ZKP, PRP and NFT rewarded so far
    Totals public totals;

    uint8 private _reentrancyStatus;

    /// @dev Emitted when new $ZKPs are allocated to reward stakers
    event ZkpRewardLimitUpdate(uint256 newLimit);
    /// @dev Emitted when new $PRPs are allocated to reward stakers
    event PrpRewardLimitUpdate(uint256 newLimit);
    /// @dev Emitted when new NFTs are allocated to reward stakers
    event NftRewardLimitUpdate(uint256 newLimit);

    /// @dev Emitted when the reward for a stake is generated
    event RewardGenerated(
        address indexed staker,
        uint256 firstLeafId,
        uint256 zkp,
        uint256 prp,
        uint256 nft
    );

    // It does not change contract storage (only `immutable` values changed).
    constructor(
        address _owner,
        address rewardMaster,
        address pantherPool,
        address prpGrantor,
        address zkpToken,
        address nftToken,
        uint32 prpRewardPerStake,
        uint32 rewardingStart,
        uint32 rewardedPeriod
    ) ImmutableOwnable(_owner) {
        require(
            // nftToken may be zero address
            rewardMaster != address(0) &&
                pantherPool != address(0) &&
                prpGrantor != address(0) &&
                zkpToken != address(0),
            "ARC:E1"
        );

        REWARD_MASTER = rewardMaster;
        PANTHER_POOL = pantherPool;
        PRP_GRANTOR = prpGrantor;

        ZKP_TOKEN = zkpToken;
        NFT_TOKEN = nftToken;

        PRP_REWARD_PER_STAKE = uint256(prpRewardPerStake);

        require(
            uint256(rewardingStart) + uint256(rewardedPeriod) > timeNow(),
            "ARC:E4"
        );
        REWARDING_START = uint256(rewardingStart);
        REWARDED_PERIOD = uint256(rewardedPeriod);
        REWARDING_END = uint256(rewardingStart) + uint256(rewardedPeriod);

        sc_ZKP_APY_PER_SECOND_DROP =
            ((START_ZKP_APY - FINAL_ZKP_APY) * 1e9) /
            uint256(rewardedPeriod);

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
    function getZkpApyAt(uint256 time) public view returns (uint256) {
        if (time < REWARDING_START) return 0;

        // overflow/underflow impossible due to uint32 input and `if` above
        unchecked {
            uint256 duration = time - REWARDING_START;
            if (duration >= REWARDED_PERIOD) return FINAL_ZKP_APY;

            return
                START_ZKP_APY - (sc_ZKP_APY_PER_SECOND_DROP * duration) / 1e9;
        }
    }

    /// @notice Allocate the rewards: $ZKP, $PRP and, NFT and approve Vault to transfer them
    /// @dev Anyone may call it.
    function prepareRewardsLimit() external {
        // Updating the rewards limits
        setPrpRewardsLimit();
        setNftRewardLimit();
        setZkpRewardsLimit();

        // Approving Vault to transfer the rewards from contract
        increaseVaultAllowance();
    }

    /// @notice Allocate the $PRP amount, which has been granted to this contract, for rewards
    /// @dev Anyone may call it.
    function setPrpRewardsLimit() public {
        uint256 unusedPrps = PRP_GRANTOR.safeGetUnusedGrantAmount(
            address(this)
        );

        uint256 limit = _getRewardLimit(
            unusedPrps,
            prpRewardsLimit,
            totals.prpRewards
        );

        if (limit > 0) {
            prpRewardsLimit = uint128(limit);
            emit PrpRewardLimitUpdate(limit);
        }
    }

    /// @notice Allocate the $NFT amount, which this contract holds, for rewards
    /// @dev Anyone may call it.
    function setNftRewardLimit() public {
        uint256 balance = NFT_TOKEN.safeBalanceOf(address(this));

        uint256 limit = _getRewardLimit(
            balance,
            nftRewardsLimit,
            totals.nftRewards
        );

        if (limit > 0) {
            nftRewardsLimit = uint128(limit);
            emit NftRewardLimitUpdate(limit);
        }
    }

    /// @notice Allocate the $ZKP amount, which this contract holds, for rewards
    /// @dev Anyone may call it
    function setZkpRewardsLimit() public {
        // External calls here are to trusted contracts only - reentrancy guard unneeded

        uint256 balance = ZKP_TOKEN.safeBalanceOf(address(this));

        uint256 limit = _getRewardLimit(
            balance,
            zkpRewardsLimit,
            totals.zkpRewards
        );

        if (limit > 0) {
            zkpRewardsLimit = limit;
            emit ZkpRewardLimitUpdate(limit);
        }
    }

    /// @notice Approve the vault to trasfer the ZKP and NFT rewards from contract.
    /// @dev Anyone may call it after updating the ZKP/NFT rewards limit.
    function increaseVaultAllowance() public {
        address vault = IPantherPoolV0(PANTHER_POOL).VAULT();

        ZKP_TOKEN.safeApprove(vault, zkpRewardsLimit);

        if (NFT_TOKEN != address(0))
            NFT_TOKEN.safeSetApprovalForAll(vault, true);
    }

    /// @notice Withdraws unclaimed rewards or accidentally sent token from this contract
    /// @dev May be only called by the {OWNER}
    function rescueErc20(
        address token,
        address to,
        uint256 amount
    ) external {
        require(_reentrancyStatus != 1, "ARC: can't be re-entered");
        _reentrancyStatus = 1;

        require(OWNER == msg.sender, "ARC: unauthorized");
        require(
            (token != ZKP_TOKEN) ||
                (block.timestamp >=
                    (REWARDING_START + ZKP_RESCUE_FORBIDDEN_PERIOD)),
            "ARC: too early withdrawal"
        );

        _claimErc20(token, to, amount);
        _reentrancyStatus = 2;
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

    // Private and internal functions follow
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
        uint256 prpAmount = 0;
        uint256 nftAmount = 0;
        uint256 nftTokenId = 0;
        {
            Totals memory _totals = totals;

            // Compute amount of the $ZKP reward  and check the limit
            {
                zkpAmount = _computeZkpReward(
                    stakeAmount,
                    lockedTill,
                    stakedAt
                );

                if (zkpAmount > 0) {
                    uint256 newTotalZkpReward = uint256(_totals.zkpRewards) +
                        zkpAmount;
                    require(
                        zkpRewardsLimit >= newTotalZkpReward,
                        "ARC: too less rewards available"
                    );
                    _totals.zkpRewards = safe96(newTotalZkpReward);

                    uint256 newScZkpStaked = uint256(_totals.scZkpStaked) +
                        uint256(stakeAmount) /
                        1e15;
                    // Overflow risk ignored as $ZKP max total supply is 1e9 tokens
                    _totals.scZkpStaked = uint40(newScZkpStaked);
                }
            }

            // Grant the total just once (for all stakes), then use a part (for every stake),
            // and finally burn unused grant amount, if it remains, in the end
            if (_totals.prpRewards < prpRewardsLimit) {
                prpAmount = PRP_REWARD_PER_STAKE;
                // `prpAmount` values assumed to be too small to cause overflow
                _totals.prpRewards += uint96(prpAmount);
            }

            // If the NFT contract defined, mint the NFT
            if (
                NFT_TOKEN != address(0) && _totals.nftRewards < nftRewardsLimit
            ) {
                nftAmount = 1;
                _totals.nftRewards += 1;
            }

            totals = _totals;
        }

        // Extract public spending keys and "secrets"
        (
            G1Point[OUT_UTXOs] memory pubSpendingKeys,
            uint256[CIPHERTEXT1_WORDS][OUT_UTXOs] memory secrets
        ) = unpackStakingData(data);

        // Finally, generate deposits (i.e. UTXOs in the MASP)
        address[OUT_UTXOs] memory tokens = [
            // PantherPool reverts if non-zero address provided for zero amount
            zkpAmount == 0 ? address(0) : ZKP_TOKEN,
            prpAmount == 0 ? address(0) : PRP_VIRTUAL_CONTRACT,
            nftAmount == 0 ? address(0) : NFT_TOKEN
        ];

        uint256[OUT_UTXOs] memory tokenIds = [0, 0, nftTokenId];
        uint256[OUT_UTXOs] memory extAmounts = [
            zkpAmount,
            prpAmount,
            nftAmount
        ];

        uint32 createdAt = safe32TimeNow();
        uint256 leftLeafId = IPantherPoolV0(PANTHER_POOL).generateDeposits(
            tokens,
            tokenIds,
            extAmounts,
            pubSpendingKeys,
            secrets,
            createdAt
        );

        emit RewardGenerated(
            staker,
            leftLeafId,
            zkpAmount,
            prpAmount,
            nftAmount
        );
    }

    // Declared `internal` for testing
    // The calling code is assumed to ensure `lockedTill > stakedAt`
    function _computeZkpReward(
        uint256 stakeAmount,
        uint256 lockedTill,
        uint256 stakedAt
    ) internal view returns (uint256 zkpAmount) {
        // No rewarding after the REWARDING_END
        if (stakedAt >= REWARDING_END) return 0;
        // No rewarding before the REWARDING_START
        if (lockedTill <= REWARDING_START) return 0;

        uint256 rewardedSince = REWARDING_START > stakedAt
            ? REWARDING_START
            : stakedAt;

        uint256 rewardedTill = lockedTill > REWARDING_END
            ? REWARDING_END
            : lockedTill;

        uint256 period = rewardedTill - rewardedSince;
        uint256 apy = getZkpApyAt(rewardedSince);
        // 3153600000 = 365 * 24 * 3600 seconds * 100 percents
        zkpAmount = (stakeAmount * apy * period) / 3153600000;
    }

    // Calculates and returns the reward limit
    function _getRewardLimit(
        uint256 balance,
        uint256 currentLimit,
        uint256 rewarded
    ) internal pure returns (uint256 newLimit) {
        unchecked {
            // impossible underflow/overflow: Limit is always greater than or equal to reward
            uint256 remaining = currentLimit - rewarded;

            if (balance > remaining) {
                // impossible underflow/overflow because of if statement
                uint256 newAllocation = balance - remaining;
                newLimit = currentLimit + newAllocation;
            }
        }
    }
}
