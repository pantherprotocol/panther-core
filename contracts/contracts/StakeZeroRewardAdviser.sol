// SPDX-License-Identifier: UNLICENSED
// solhint-disable-next-line compiler-fixed, compiler-gt-0_8
pragma solidity ^0.8.0;

import "./actions/StakingMsgProcessor.sol";
import "./interfaces/IRewardAdviser.sol";

/**
 * @title StakeZeroRewardAdviser
 * @notice The "reward adviser" for the `RewardMaster` that returns the "zero reward advice" only.
 * @dev The "zero" reward advice it the `Advice` with zero `sharesToCreate` and `sharesToRedeem`.
 * On "zero" advices, the RewardMaster skips creating/redeeming "treasure shares" for/to stakers.
 */
contract StakeZeroRewardAdviser is StakingMsgProcessor, IRewardAdviser {
    // solhint-disable var-name-mixedcase

    // `action` for the "staked" message
    // For "advanced" stakes it is `0xcc995ce8`
    bytes4 private immutable STAKE;

    // `action` for the "unstaked" message
    // For "advanced" stakes it is `0xb8372e55`
    bytes4 private immutable UNSTAKE;

    // solhint-enable var-name-mixedcase

    /// @param stakeType The staking "type"
    /// For "advanced staking" it is `0x7ec13a06 = bytes4(keccak256("advanced"))`
    constructor(bytes4 stakeType) {
        require(stakeType != bytes4(0), "ZRA:E1");
        STAKE = _encodeStakeActionType(stakeType);
        UNSTAKE = _encodeUnstakeActionType(stakeType);
    }

    /// @dev It is assumed to be called by the RewardMaster contract.
    /// It returns the "zero" reward advises, no matter who calls it.
    function getRewardAdvice(bytes4 action, bytes memory message)
        external
        override
        returns (Advice memory)
    {
        require(
            action == UNSTAKE || action == UNSTAKE,
            "ZRA: unsupported action"
        );

        _onRequest(action, message);

        // Return the "zero" advice
        return
            Advice(
                address(0), // createSharesFor
                0, // sharesToCreate
                address(0), // redeemSharesFrom
                0, // sharesToRedeem
                address(0) // sendRewardTo
            );
    }

    // solhint-disable-next-line no-empty-blocks
    function _onRequest(bytes4 action, bytes memory message) internal virtual {
        // Child contracts may re-define it
    }
}
