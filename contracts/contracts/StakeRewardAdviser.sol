// SPDX-License-Identifier: UNLICENSED
// solhint-disable-next-line compiler-fixed, compiler-gt-0_8
pragma solidity ^0.8.0;

import "./actions/StakingMsgProcessor.sol";
import "./interfaces/IRewardAdviser.sol";
import "./utils/Utils.sol";

/**
 * @title StakeRewardAdviser
 * @notice It "advices" to the "RewardMaster" on staking rewards ("shares").
 * @dev It acts as the "RewardAdviser" for the "RewardMaster": the latest calls
 * this contract to process messages from the "Staking" contract.
 */
contract StakeRewardAdviser is StakingMsgProcessor, Utils, IRewardAdviser {
    // solhint-disable var-name-mixedcase
    bytes4 private immutable STAKED;
    bytes4 private immutable UNSTAKED;
    uint256 public immutable FACTOR;
    // solhint-enable var-name-mixedcase

    uint256 private constant SCALE = 1e3;

    constructor(bytes4 stakeType, uint256 stakeAmountToSharesScaledFactor) {
        require(
            stakeType != bytes4(0) && stakeAmountToSharesScaledFactor != 0,
            "PSA:E1"
        );
        STAKED = _encodeStakeActionType(stakeType);
        UNSTAKED = _encodeUnstakeActionType(stakeType);
        FACTOR = stakeAmountToSharesScaledFactor;
    }

    function adviceReward(bytes4 action, bytes memory message)
        external
        view
        override
        returns (Advice memory)
    {
        (address staker, uint96 amount, , , , ) = _unpackStakingActionMsg(
            message
        );
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
