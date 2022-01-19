// SPDX-License-Identifier: UNLICENSED
// solhint-disable-next-line compiler-fixed, compiler-gt-0_8
pragma solidity ^0.8.0;

import "../actions/StakingMsgProcessor.sol";
import "../interfaces/IStakingTypes.sol";

contract MockStakingMsgProcessor is StakingMsgProcessor {
    function internalEncodeStakeActionType(bytes4 stakeType)
        external
        pure
        returns (bytes4)
    {
        return _encodeStakeActionType(stakeType);
    }

    function internalEncodeUnstakeActionType(bytes4 stakeType)
        external
        pure
        returns (bytes4)
    {
        return _encodeUnstakeActionType(stakeType);
    }

    function internalPackStakingActionMsg(
        address staker,
        IStakingTypes.Stake memory stake,
        bytes calldata data
    ) internal pure returns (bytes memory) {
        return _packStakingActionMsg(staker, stake, data);
    }

    function internalUnpackStakingActionMsg(bytes memory message)
        external
        pure
        returns (
            address staker,
            uint96 amount,
            uint32 id,
            uint32 stakedAt,
            uint32 lockedTill,
            uint32 claimedAt,
            bytes memory data
        )
    {
        return _unpackStakingActionMsg(message);
    }
}
