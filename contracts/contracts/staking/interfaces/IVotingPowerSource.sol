// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
// slither-disable-next-line solc-version,pragma
pragma solidity ^0.8.4;

interface IVotingPowerSource {
    /// @dev Voting power integrants
    struct Power {
        uint96 own; // voting power that remains after delegating to others
        uint96 delegated; // voting power delegated by others
    }

    function power(address voter) external view returns (Power memory);
}
