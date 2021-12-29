// SPDX-License-Identifier: MIT
// solhint-disable-next-line compiler-fixed, compiler-gt-0_8
pragma solidity ^0.8.0;

import "./interfaces/IVestingPools.sol";
import "./interfaces/IRewardPool.sol";
import "./utils/Utils.sol";

/**
 * @title RewardPool
 * @notice It vests $ZKP token from the Panther Protocol "Reward Pool".
 * @dev One of the vesting pools (maybe, the major one) which the VestingPools
 * contract vests $ZKP tokens to is the "Reward Pool" (aka "Protocol Pool").
 * This contract assumes to have a "pool wallet" role with the VestingPools,
 * and therefore has a privilege of vesting $ZKPs from the Reward Pool.
 * It requests the VestingPools to vest a share of the pool to the "recipient".
 * The "Stakes" contract, that distributes tokens to stakers as rewards,
 * is assumed to be the "recipient".
 *
 * This contract runs behind an upgradable proxy, and is deemed to be
 * upgraded on deployment of the "core" Panther Protocol smart contracts.
 */
contract RewardPool is Utils, IRewardPool {
    /// @notice Address of the owner
    address public immutable OWNER;

    /// @notice Address of the VestingPools instance
    address public immutable VESTING_POOLS;

    uint256[500] private _gap; // slot skipped for future upgrades

    /// @notice ID of the pool (in the VestingPools) to vest from
    uint8 public poolId;

    /// @dev Share (percentage) of the pool to vest
    uint8 public allocation;

    /// @dev (UNIX) Time when vesting gets disabled;
    uint32 public endTime;

    /// @notice Address to vest tokens to the {recipient}
    address public recipient;

    constructor(address _vestingPools, address _owner) {
        require(_vestingPools != address(0), _owner != address(0), "RP:E1");
        OWNER = _owner;
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
        require(msg.sender == recipient, "RP:E2");
        require(timeNow() < endTime, "RP:E3");

        amount = _releasableAmount();

        if (amount != 0) {
            IVestingPools(VESTING_POOLS).releaseTo(poolId, recipient, amount);
            emit Vested(amount);
        }
    }

    /// @notice Sets the {poolId}, the {recipient} and the {allocation} to given values
    /// @dev Owner only may call, once only
    /// This contract address must be set in the VestingPools as the wallet for the pool
    function initialize(
        uint8 _poolId,
        address _recipient,
        uint8 _allocation,
        uint32 _endTime
    ) external {
        // OWNER may call only
        require(msg.sender == OWNER, "RP:E4");
        // once only
        require(recipient == address(0), "RP:E5");
        // poolId may be 0, unlike _recipient and _allocation
        require(_recipient != address(0) && _allocation != 0, "RP:E6");
        // _endTime can't be in the past
        require(_endTime > timeNow(), "RP:E7");
        // this contract must be registered with the VestingPools
        require(IVestingPools(VESTING_POOLS).getWallet(_poolId) == address(this), "RP:E8");

        poolId = _poolId;
        recipient = _recipient;
        allocation = _allocation;
        endTime = _endTime;

        emit Initialized(_poolId, _recipient, _allocation, _endTime);
    }

    function _releasableAmount() internal returns (uint256) {
        uint256 shareable = IVestingPools(VESTING_POOLS).releasableAmount(poolId);
        if (shareable == 0) return 0;

        return (shareable * allocation) / 100;
    }
}
