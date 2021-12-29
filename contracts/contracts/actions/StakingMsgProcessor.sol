// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IStakingTypes.sol";

abstract contract StakingMsgProcessor {
    bytes4 internal constant STAKE_ACTION = bytes4(keccak256("staked"));
    bytes4 internal constant UNSTAKE_ACTION = bytes4(keccak256("unstaked"));

    function _packStakingActionMsg(
        address staker,
        IStakingTypes.Stake memory stake,
        bytes calldata data
    ) internal pure returns (bytes memory) {
        return
            abi.encodePacked(
                staker, // address
                stake.amount, // uint96
                stake.id, // uint32
                stake.stakedAt, // uint32
                stake.lockedTill, // uint32
                stake.claimedAt, // uint32
                data // bytes
            );
    }

    function _unpackStakingActionMsg(bytes memory message)
        internal
        pure
        returns (
            address staker,
            uint96 amount,
            uint32 id,
            uint32 stakedAt,
            uint32 lockedTill,
            uint32 claimedAt
        )
    {
        // FIXME: replace mock code
        staker = address(0);
        amount = 0;
        id = 0;
        stakedAt = 0;
        lockedTill = 0;
        claimedAt = 0;
    }
}
