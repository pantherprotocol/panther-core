// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2023 Panther Ventures Limited Gibraltar
pragma solidity 0.8.16;

import "./interfaces/IRewardAdviser.sol";
import "./interfaces/IActionMsgReceiver.sol";
import { ADVANCED_STAKE, ADVANCED_STAKE_V2, ADVANCED_UNSTAKE_V2 } from "./actions/Constants.sol";

/**
 * @title AdvancedStakeV2ActionMsgTranslator
 * @notice It processes action messages for stakes of the `advanced-v2` type.
 * @dev It "translates" the `action` in messages so that other contracts, which
 * are "unaware" of "v2" stake type, may process this type stakes exactly like
 * they process `advanced` type stakes.
 * It shall be registered with the `RewardMaster` as the "RewardAdviser" for
 * `advanced-v2` type stakes and the "ActionOracle" for `advanced` type stakes.
 * Being called `getRewardAdvice` by the RewardMaster for a message with the
 * `advanced-v2` STAKE action, it replaces the `action` to be the `advanced`
 * (but not `advanced-v2`) STAKE action.
 * Then it calls `onAction` on the RewardMaster with the substituted message.
 * When called back, the latter processes the substituted action message as if
 * it is the `advanced` (not `advanced-v2`) STAKE action.
 */
contract AdvancedStakeV2ActionMsgTranslator is IRewardAdviser {
    // solhint-disable var-name-mixedcase

    /// @notice RewardMaster contract instance
    address private immutable REWARD_MASTER;

    // solhint-enable var-name-mixedcase

    constructor(address rewardMaster) {
        require(rewardMaster != address(0), "Zero address");

        REWARD_MASTER = rewardMaster;
    }

    /// @dev To be called by the {RewardMaster} for `advanced-v2` type actions.
    /// It makes the `action` to look like the `advanced` (not "v2") type action
    /// and calls the {RewardMaster} back simulating a "new" action message.
    function getRewardAdvice(bytes4 action, bytes memory message)
        external
        override
        returns (Advice memory)
    {
        require(msg.sender == REWARD_MASTER, "AMT: unauthorized");

        if (action == ADVANCED_STAKE_V2) {
            // Replace the action and return the message back to REWARD_MASTER
            IActionMsgReceiver(REWARD_MASTER).onAction(ADVANCED_STAKE, message);
        } else {
            require(action == ADVANCED_UNSTAKE_V2, "AMT: unsupported action");
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
}
