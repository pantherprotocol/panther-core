// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.4;

import { LockData } from "../common/Types.sol";
import "../interfaces/IVault.sol";

contract FakeVault is IVault {
    event DebugData(LockData data);

    function lockAsset(LockData calldata data) external override {
        emit DebugData(data);
    }

    function unlockAsset(LockData memory data) external override {
        emit DebugData(data);
    }
}
