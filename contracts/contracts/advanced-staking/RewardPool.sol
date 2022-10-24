// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
// solhint-disable var-name-mixedcase
// solhint-disable-next-line compiler-fixed, compiler-gt-0_8
pragma solidity ^0.8.0;

import "./interfaces/IVestingPools.sol";
import "./interfaces/IRewardPool.sol";
import "../common/ImmutableOwnable.sol";
import "../common/Utils.sol";

/**
 * @title RewardPool
 * @notice It vests $ZKP token from the Panther Protocol "Reward Pool".
 * @dev One of the vesting pools (maybe, the major one) which the VestingPools
 * contract vests $ZKP tokens to is the "Reward Pool" (aka "Protocol Pool").
 * This contract assumed to have a "pool wallet" role with the VestingPools,
 * and therefore has a privilege to request vesting $ZKPs from the Reward Pool
 * to the "recipient".
 * The "RewardMaster" contract, that distributes tokens to users as rewards,
 * is assumed to be the "recipient".
 *
 * This contract is expected to be replaced. Therefore it allows the owner
 * to transfer the "pool wallet" role to another account.
 */
contract RewardPool is ImmutableOwnable, Utils, IRewardPool {
    /// @notice Address of the VestingPools instance
    address public immutable VESTING_POOLS;

    /// @notice ID of the pool (in the VestingPools) to vest from
    uint8 public poolId;

    /// @dev (UNIX) Time when vesting gets disabled
    uint32 public endTime;

    /// @notice Address to vest tokens to
    address public recipient;

    constructor(address _vestingPools, address _owner)
        ImmutableOwnable(_owner)
        nonZeroAddress(_vestingPools)
    {
        VESTING_POOLS = _vestingPools;
    }

    /// @inheritdoc IRewardPool
    function releasableAmount() external view override returns (uint256) {
        if (recipient == address(0)) return 0;
        if (timeNow() >= endTime) return 0;

        return _releasableAmount();
    }

    /// @inheritdoc IRewardPool
    function vestRewards() external override returns (uint256 amount) {
        // revert if unauthorized or recipient not yet set
        require(msg.sender == recipient, "RP: unauthorized");
        require(timeNow() < endTime, "RP: expired");

        amount = _releasableAmount();

        if (amount != 0) {
            // here and after, no reentrancy guard needed for calls to VESTING_POOLS
            // slither-disable-next-line unused-return
            IVestingPools(VESTING_POOLS).releaseTo(poolId, recipient, amount);
            emit Vested(amount);
        }
    }

    /// @notice Sets the {poolId} and the {recipient} to given values
    /// @dev Owner only may call, once only
    /// This contract address must be set in the VestingPools as the wallet for the pool
    function initialize(
        uint8 _poolId,
        address _recipient,
        uint32 _endTime
    ) external onlyOwner nonZeroAddress(_recipient) {
        // once only
        require(recipient == address(0), "RP: initialized");
        // _endTime can't be in the past
        require(_endTime > timeNow(), "RP: expired");
        // this contract must be registered with the VestingPools
        require(
            IVestingPools(VESTING_POOLS).getWallet(_poolId) == address(this),
            "RP:E7"
        );

        poolId = _poolId;
        recipient = _recipient;
        endTime = _endTime;

        emit Initialized(_poolId, _recipient, _endTime);
    }

    /// @notice Calls VestingPools to transfer 'pool wallet' role to given address
    /// @dev Owner only may call, once only
    function transferPoolWalletRole(address newWallet)
        external
        onlyOwner
        nonZeroAddress(newWallet)
    {
        IVestingPools(VESTING_POOLS).updatePoolWallet(poolId, newWallet);
    }

    function _releasableAmount() internal view returns (uint256) {
        return IVestingPools(VESTING_POOLS).releasableAmount(poolId);
    }

    modifier nonZeroAddress(address account) {
        require(account != address(0), "RP: zero address");
        _;
    }
}
