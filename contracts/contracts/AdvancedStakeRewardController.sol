// SPDX-License-Identifier: UNLICENSED
// solhint-disable-next-line compiler-fixed, compiler-gt-0_8
pragma solidity ^0.8.0;

import "./actions/AdvancedStakingDataDecoder.sol";
import "./actions/StakingMsgProcessor.sol";
import "./interfaces/IERC721Receiver.sol";
import "./interfaces/INftGrantor.sol";
import "./interfaces/IPantherPoolV0.sol";
import "./interfaces/IRewardAdviser.sol";
import "./utils/Claimable.sol";
import "./utils/ImmutableOwnable.sol";
import "./utils/NonReentrant.sol";
import "./utils/Utils.sol";

/**
 * @title AdvancedStakeRewardController
 * @notice It generates UTXOs in the MASP as rewards to stakers for the "Advanced Staking"
 * @dev This contract is supposed to run on the Polygon. Unless otherwise mentioned, other smart
 * contracts are supposed to run on the Polygon also.
 * As the "Reward Adviser" on the "advanced" stakes, it receives `getRewardAdvice` calls from the
 * `RewardMaster` contract with the `STAKE` message being the call parameter.
 * On the `getRewardAdvice` call received, this contract:
 * - computes the amount of the $ZKP reward to the staker
 * - calls `grant` on the `PantherPoolV0` with the `FOR_ADVANCED_STAKE_GRANT` as the "grant type",
 *  and the staker as the "grantee", getting the amount of PRPs granted from the response
 * - if the `NFT_TOKEN` is non-zero address, it calls `grantOneToken` on the NFT_TOKEN, and gets
 * the `tokenId` of the minted NFT token
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
 * thePolygon via the PoS bridge and mediator contracts. The RewardMaster on the Polygon handles a
 * bridged STAKE message (calling the `getRewardAdvice`) as if the message had been sent by the
 * Staking on the Polygon.
 *
 * As a prerequisite:
 * - this contract shall be authorized as:
 * -- "RewardAdviser" with the RewardMaster on Polygon for advanced stakes
 * -- "Curator" of the FOR_ADVANCED_STAKE_GRANT with the PantherPoolV0
 * -- "Minter" (or "grantor") with the NFT_TOKEN contract
 * - this contract shall hold enough $ZKP balance to reward stakers
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
    /// @dev Total amount of $ZKPs, PRPd and NFTs (ever) rewarded and staked
    struct Totals {
        uint96 zkpRewards;
        uint96 prpRewards;
        uint24 nftRewards;
        // Accumulated amount of $ZKP (ever) staked, scaled (divided) by 1e15
        uint40 scZkpStaked;
    }

    // solhint-disable var-name-mixedcase

    // `stakeType` for "Advance Staking"
    // bytes4(keccak256("advanced"))
    bytes4 private constant STAKE_TYPE = 0x7ec13a06;
    // `action` for the "staked" and message
    // bytes4(keccak256(abi.encodePacked(bytes4(keccak256("stake"), STAKE_TYPE)))
    bytes4 private constant STAKE = 0xcc995ce8;
    // `action` for the "unstaked" message
    // bytes4(keccak256(abi.encodePacked(bytes4(keccak256("unstake"), STAKE_TYPE)))
    bytes4 private constant UNSTAKE = 0xb8372e55;
    // PRP grant type for the "advanced" stake
    // bytes4(keccak256("forAdvancedStakeGrant"))
    bytes4 private constant FOR_ADVANCED_STAKE_GRANT = 0x31a180d4;

    /// @notice RewardMaster contract instance
    address public immutable REWARD_MASTER;
    /// @notice PantherPoolV0 contract instance
    address public immutable PANTHER_POOL;

    // Address of the $ZKP token contract
    address private immutable ZKP_TOKEN;
    // Address of the NFT token contract
    address private immutable NFT_TOKEN;
    // PRP "quasi-token" contract is PANTHER_POOL

    /// @notice (UNIX) Time when staking rewards start to accrue
    // $ZKP APY starts declining this time as well
    uint256 public immutable REWARDING_START;

    // Period (seconds) when the $ZKP APY linearly declines (since REWARDING_START)
    // (this period shall not yet be in the past on the contract deployment)
    uint256 private immutable ZKP_APY_DECLINE_PERIOD;
    // $ZKP APY at REWARDING_START (it declines from this value)
    uint256 private constant START_ZKP_APY = 70;
    // $ZKP APY at the end of (and after) the ZKP_APY_DECLINE_PERIOD
    uint256 private constant FINAL_ZKP_APY = 40;
    // $ZKP APY drop (scaled by 1e9) per second of ZKP_APY_DECLINE_PERIOD
    uint256 private immutable sc_ZKP_APY_PER_SECOND_DROP;

    uint256 private constant ZKP_RESCUE_FORBIDDEN_PERIOD = 90 days;

    /// @notice Block when this contract is deployed
    uint256 public immutable START_BLOCK;

    // solhint-enable var-name-mixedcase

    /// @notice Amount of $ZKPs allocated for rewards
    /// @dev Unlike $ZKPs, PRPs and NFTs are unlimited (not allocated in advance)
    uint256 public zkpRewardsLimit;

    /// @notice Total amounts of $ZKP, PRP and NFT rewarded so far
    Totals public totals;

    uint8 private _reentrancyStatus;

    /// @dev Emitted when new $ZKPs are allocated to reward stakers
    event ZkpRewardLimitUpdate(uint256 newLimit);

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
        address zkpToken,
        address nftToken,
        uint32 rewardingStart,
        uint32 zkpApyDeclinePeriod
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

        require(
            uint256(rewardingStart) + uint256(zkpApyDeclinePeriod) > timeNow(),
            "ARC:E4"
        );
        REWARDING_START = uint256(rewardingStart);
        ZKP_APY_DECLINE_PERIOD = uint256(zkpApyDeclinePeriod);

        // The scale factor is 1e9 (xxx_ZKP_APY is percents, i.e. scaled by 1e2)
        sc_ZKP_APY_PER_SECOND_DROP =
            ((START_ZKP_APY - FINAL_ZKP_APY) * 1e7) /
            uint256(zkpApyDeclinePeriod);

        START_BLOCK = block.number;
    }

    /// @dev To be called by the {RewardMaster} contract on `STAKE` and `UNSTAKE` actions.
    /// The caller is trusted to never call STAKE:
    /// - twice for the same stake
    /// - after the rewarded period has ended
    function getRewardAdvice(bytes4 action, bytes memory message)
        external
        override
        returns (Advice memory)
    {
        require(msg.sender == REWARD_MASTER, "ARC: unauthorized");

        if (action == STAKE) {
            _generateRewards(message);
        } else {
            require(action == UNSTAKE, "ARC: unsupported action");
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
    function getZkpApyAt(uint32 time) public view returns (uint256) {
        if (time < REWARDING_START) return 0;

        // overflow/underflow impossible due to uint32 input and `if` above
        unchecked {
            uint256 duration = time - REWARDING_START;
            if (duration >= ZKP_APY_DECLINE_PERIOD) return FINAL_ZKP_APY;

            return
                START_ZKP_APY - (sc_ZKP_APY_PER_SECOND_DROP * duration) / 1e9;
        }
    }

    /// @notice Allocate the $ZKP amount, which this contract holds, for rewards
    /// @dev Anyone may call it
    function setZkpRewardsLimit() external {
        // TODO: replace low-levels using with `library TransferHelper` in `panther-core`
        uint256 balance;
        {
            // trusted token contract - reentrancy guard unneeded
            // solhint-disable-next-line avoid-low-level-calls
            (bool success, bytes memory data) = ZKP_TOKEN.call(
                // bytes4(keccak256(bytes('balanceOf(address)')));
                abi.encodeWithSelector(0x70a08231, address(this))
            );
            require(success && (data.length != 0), "ARC:E5");
            balance = abi.decode(data, (uint256));
        }

        uint256 limit = zkpRewardsLimit;
        uint256 rewarded = uint256(totals.zkpRewards);
        uint256 remaining = limit - rewarded;

        if (balance > remaining) {
            // Update the limit and approve PANTHER_POOL to spend from this contract balance
            uint256 newAllocation = balance - remaining;
            uint256 newLimit = limit + newAllocation;

            // trusted token contract - reentrancy guard unneeded
            // solhint-disable-next-line avoid-low-level-calls
            (bool success, bytes memory data) = ZKP_TOKEN.call(
                // bytes4(keccak256('approve(address,uint256)'));
                abi.encodeWithSelector(0x095ea7b3, PANTHER_POOL, newLimit)
            );
            require(
                success && (data.length == 0 || abi.decode(data, (bool))),
                "TransferHelper::safeApprove: approve failed"
            );

            zkpRewardsLimit = limit + newAllocation;
            emit ZkpRewardLimitUpdate(zkpRewardsLimit);
        }
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

    /// Private and internal functions follow
    // Some of them declared `internal` rather than `private` to ease testing

    function _generateRewards(bytes memory message) internal {
        (
            address staker,
            uint96 stakeAmount, // stake id (irrelevant)
            ,
            uint32 stakedAt,
            uint32 lockedTill, // claimedAt (irrelevant)
            ,
            bytes memory data
        ) = _unpackStakingActionMsg(message);

        require(stakeAmount != 0, "ARC: unexpected zero stakeAmount");
        require(stakedAt >= REWARDING_START, "ARC: unexpected stakedAt");
        require(lockedTill > stakedAt, "ARC: unexpected lockedTill");

        uint256 zkpAmount = 0;
        uint256 prpAmount = 0;
        uint256 nftAmount = 0;
        uint256 nftTokenId = 0;
        {
            Totals memory _totals = totals;

            // Compute amount of the $ZKP reward
            {
                uint256 period = uint256(lockedTill - stakedAt);
                uint256 apy = getZkpApyAt(stakedAt);
                zkpAmount = (uint256(stakeAmount) * apy * period) / 365 days;

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
                // Risk of overflow ignored as the $ZKP max total supply is 1e9 tokens
                _totals.scZkpStaked = uint40(newScZkpStaked);
            }

            // Register PRP grant to this contract (it will be "burnt" for PRP UTXO)
            prpAmount = IPantherPoolV0(PANTHER_POOL).grant(
                address(this),
                FOR_ADVANCED_STAKE_GRANT
            );
            // `prpAmount` values assumed to be too small to cause overflow
            _totals.prpRewards += uint96(prpAmount);

            // TODO: enhance PRP granting to save gas
            // Grant the total just once (for all stakes), then use a part (for every stake),
            // and finally burn unused grant amount, if it remains, in the end

            // If the NFT token contract defined, mint the NFT
            if (NFT_TOKEN != address(0)) {
                // trusted contract called - no reentrancy guard needed
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
            G1Point[OUT_UTXOs] memory pubSpendingKeys,
            uint256[CIPHERTEXT1_WORDS][OUT_UTXOs] memory secrets
        ) = unpackStakingData(data);

        // Finally, generate deposits (i.e. UTXOs with the MASP)
        address[OUT_UTXOs] memory tokens = [ZKP_TOKEN, PANTHER_POOL, NFT_TOKEN];
        uint256[OUT_UTXOs] memory tokenIds = [0, 0, nftTokenId];
        uint256[OUT_UTXOs] memory extAmounts = [
            zkpAmount,
            prpAmount,
            nftAmount
        ];
        uint256 createdAt = timeNow();
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
}
