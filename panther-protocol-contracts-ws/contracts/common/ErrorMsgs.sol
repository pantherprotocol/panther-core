// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// QuadIncrementalMerkleTrees contract
string constant ERR_ZERO_ROOT = "QT:E1"; // merkle tree root can not be zero
string constant ERR_CANT_DEL_ROOT = "QT:E2"; // failed to delete a root from history

// CommitmentsTrees contract
string constant ERR_TOO_LARGE_COMMITMENTS = "CT:E1"; // commitment exceeds maximum scalar field size

// Registry contract
string constant ERR_INVALID_PUBKEYS = "RG:E1"; // Unexpected format of Pub Keys

// PantherPool contract
string constant ERR_EXPIRED_TX_TIME = "PP:E1";
string constant ERR_TOO_LARGE_TIME = "PP:E2";
string constant ERR_ZERO_TOKEN_EXPECTED = "PP:E3";
string constant ERR_ZERO_TOKEN_UNEXPECTED = "PP:E4";
string constant ERR_DEPOSIT_OVER_LIMIT = "PP:E5";
string constant ERR_DEPOSIT_FROM_ZERO_ADDRESS = "PP:E6";
string constant ERR_WITHDRAW_OVER_LIMIT = "PP:E7";
string constant ERR_WITHDRAW_TO_ZERO_ADDRESS = "PP:E8";
string constant ERR_INVALID_JOIN_INPUT = "PP:E9";
string constant ERR_TOO_LARGE_NULLIFIER = "PP:E10";
string constant ERR_SPENT_NULLIFIER = "PP:E11";
string constant ERR_UNKNOWN_MERKLE_ROOT = "PP:E12";
string constant ERR_INVALID_PROOF = "PP:E13";
string constant ERR_PLUGIN_FAILURE = "PP:E14";
string constant ERR_ZERO_FEE_PAYER = "PP:E15";
string constant ERR_TOO_LARGE_ROOT = "PP:E16";
