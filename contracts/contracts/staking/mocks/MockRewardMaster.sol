// SPDX-License-Identifier: UNLICENSED
// solhint-disable-next-line compiler-fixed, compiler-gt-0_8
// slither-disable-next-line solc-version
pragma solidity ^0.8.4;

import "../RewardMaster.sol";

contract MockRewardMaster is RewardMaster {
    constructor(
        address _rewardToken,
        address _rewardPool,
        address _owner
    )
        RewardMaster(_rewardToken, _rewardPool, _owner)
    // solhint-disable-next-line no-empty-blocks
    {

    }

    function internalComputeRedemption(
        uint256 sharesToRedeem,
        UserRecord memory rec,
        uint256 _accumRewardPerShare
    )
        external
        pure
        returns (
            uint256 reward,
            uint256 newShares,
            uint256 newOffset
        )
    {
        return _computeRedemption(sharesToRedeem, rec, _accumRewardPerShare);
    }
}
