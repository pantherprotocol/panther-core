// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import { LockData } from "../common/Types.sol";

interface IVault {
    function lockAsset(LockData calldata data) external;

    function unlockAsset(LockData memory data) external;

    event Locked(LockData data);
    event Unlocked(LockData data);
}
