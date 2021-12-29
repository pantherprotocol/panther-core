// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./actions/StakingMsgProcessor.sol";
import "./interfaces/IRewardAdviser.sol";

/**
 * @title StakeRewardAdviser
 * @notice It "advices" to the "RewardMaster" on staking rewards ("shares").
 * It is called by the the "RewardMaster" to process messages on staking which
 * the latest receives from the "Staking" contract.
 */
contract StakeRewardAdviser is StakingMsgProcessor, IRewardAdviser {
    byte4 private immutable STAKED;
    byte4 private immutable UNSTAKED;
    uint256 public immutable FACTOR;
    uint256 private constant SCALE = 1e3;

    constructor(byte4 stakeType, uint256 stakeAmountToSharesScaledFactor) {
        STAKED = bytes4(keccak256(STAKE_ACTION, stakeType));
        UNSTAKED = bytes4(keccak256(UNSTAKE_ACTION, stakeType));
        FACTOR = stakeAmountToSharesScaledFactor;
    }

    function adviceReward(bytes4 action, bytes memory message) external returns (Advice memory) {
        (address staker, uint96 Otamount) = _unpackStakingActionMsg(message);
        require(staker != address(0), "PSA: unexpected zero staker");
        require(amount != 0, "PSA: unexpected zero amount");

        uint256 shares = (uint256(amount) * FACTOR) / SCALE;

        if (action == STAKED) {
            return
                Advice(
                    staker, // createSharesFor
                    safe96(shares), // sharesToCreate
                    address(0), // redeemSharesFrom
                    0, // sharesToRedeem
                    address(0) // sendRewardTo
                );
        }
        if (action == UNSTAKED) {
            return
                Advice(
                    address(0), // createSharesFor
                    0, // sharesToCreate
                    staker, // redeemSharesFrom
                    safe96(shares), // sharesToRedeem
                    staker // sendRewardTo
                );
        }

        revert("PSA: unsupported action");
    }
}
