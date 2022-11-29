// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
// slither-disable-next-line solc-version
pragma solidity ^0.8.4;

interface IArptHistory {
    function getScArptAt(uint32 timestamp)
        external
        view
        returns (uint256 scArpt);
}
