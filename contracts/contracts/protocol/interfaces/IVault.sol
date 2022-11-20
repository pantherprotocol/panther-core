// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.16;

import { LockData } from "../../common/Types.sol";

interface IVault {
    function lockAsset(LockData calldata data) external;

    function unlockAsset(LockData memory data) external;

    event Locked(LockData data);
    event Unlocked(LockData data);
}
