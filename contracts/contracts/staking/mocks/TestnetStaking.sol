// SPDX-License-Identifier: BUSL-1.1
// slither-disable-next-line solc-version
pragma solidity ^0.8.4;

import "../Staking.sol";

/**
 * @title TestnetStaking
 * @notice It inherits Staking and lets the owner update the terms to
 * facilitate testing. This contract is not supposed to be used in
 * production.
 */
contract TestnetStaking is Staking {
    constructor(
        address stakingToken,
        address rewardMaster,
        address owner
    ) Staking(stakingToken, rewardMaster, owner) {} // solhint-disable no-empty-blocks

    function updateTerms(bytes4 _stakeType, Terms memory _terms)
        external
        onlyOwner
    {
        terms[_stakeType] = _terms;
    }
}
