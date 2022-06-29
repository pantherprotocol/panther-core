// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.4;

import "../PantherPoolV0.sol";

/**
 * @title TestnetPantherPoolV0
 * @notice Multi-Asset Shielded Pool main contract v0 that only lives on test networks.
 * @dev It inherits PantherPoolV0 and lets the owner update the exitTime to
 * facilitate testing. This contract is not supposed to be used in production.
 */
contract TestnetPantherPoolV0 is PantherPoolV0 {
    uint256 private _testnetExitTime;

    // solhint-disable-line no-empty-blocks
    constructor(
        address _owner,
        uint256 _exitTime,
        address assetRegistry,
        address vault,
        address prpGrantor
    ) PantherPoolV0(_owner, _exitTime, assetRegistry, vault, prpGrantor) {}

    function exitTime() public view override returns (uint256) {
        return _testnetExitTime == 0 ? super.exitTime() : _testnetExitTime;
    }

    function updateExitTime(uint256 newExitTime) external onlyOwner {
        _testnetExitTime = newExitTime;
    }
}
