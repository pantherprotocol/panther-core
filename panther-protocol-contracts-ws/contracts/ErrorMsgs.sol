// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// QuadIncrementalMerkleTrees contract
string constant ERR_ZERO_ROOT = "QT:E1"; // merkle tree root can not be zero
string constant ERR_CANT_DEL_ROOT = "QT:E2"; // failed to delete a root from history

// CommitmentsTrees contract
string constant ERR_TOO_LARGE_COMMITMENTS = "CT:E1"; // commitment exceeds maximum scalar field size

// Registry contract
string constant ERR_INVALID_PUBKEYS = "RG:E1"; // Unexpected format of Pub Keys
