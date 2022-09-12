// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.4;

interface IPlugin {
    function callPlugin(
        address plugin,
        uint256 value,
        bytes calldata callData
    ) external returns (bool success);
}
