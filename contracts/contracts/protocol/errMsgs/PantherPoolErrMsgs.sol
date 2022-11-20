// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.16;

// CommitmentGenerator contract
string constant ERR_TOO_LARGE_PUBKEY = "CG:E1";

// CommitmentsTrees contract
string constant ERR_TOO_LARGE_COMMITMENTS = "CT:E1"; // commitment exceeds maximum scalar field size

// MerkleProofVerifier
string constant ERR_MERKLE_PROOF_VERIFICATION_FAILED = "MP:E1";
string constant ERR_TRIAD_INDEX_MIN_VALUE = "MP:E2";
string constant ERR_TRIAD_INDEX_MAX_VALUE = "MP:E3";

// TriadIncrementalMerkleTrees contract
string constant ERR_ZERO_ROOT = "TT:E1"; // merkle tree root can not be zero

// PantherPool contract
string constant ERR_DEPOSIT_OVER_LIMIT = "PP:E1";
string constant ERR_DEPOSIT_FROM_ZERO_ADDRESS = "PP:E2";
string constant ERR_EXITCOMMIT_EXISTS = "PP:E32";
string constant ERR_EXITCOMMIT_LOCKED = "PP:E33";
string constant ERR_EXITCOMMIT_MISSING = "PP:E34";
string constant ERR_EXPIRED_TX_TIME = "PP:E3";
string constant ERR_INVALID_JOIN_INPUT = "PP:E4";
string constant ERR_INVALID_PROOF = "PP:E5";
string constant ERR_MISMATCHED_ARR_LENGTH = "PP:E6";
string constant ERR_PLUGIN_FAILURE = "PP:E7";
string constant ERR_SPENT_NULLIFIER = "PP:E8";
string constant ERR_TOO_EARLY_CREATED_AT = "PP:E9";
string constant ERR_TOO_EARLY_EXIT = "PP:E30";
string constant ERR_TOO_LARGE_AMOUNT = "PP:E10";
string constant ERR_TOO_LARGE_COMMITMENT = "PP:E11";
string constant ERR_TOO_LARGE_NULLIFIER = "PP:E12";
string constant ERR_TOO_LARGE_LEAFID = "PP:E27";
string constant ERR_TOO_LARGE_PRIVKEY = "PP:E28";
string constant ERR_TOO_LARGE_ROOT = "PP:E13";
string constant ERR_TOO_LARGE_SCALED_AMOUNT = "PP:E26";
string constant ERR_TOO_LARGE_TIME = "PP:E14";
string constant ERR_UNCONFIGURED_EXIT_TIME = "PP:E31";
string constant ERR_UNKNOWN_MERKLE_ROOT = "PP:E16";
string constant ERR_WITHDRAW_OVER_LIMIT = "PP:E17";
string constant ERR_WITHDRAW_TO_ZERO_ADDRESS = "PP:E18";
string constant ERR_WRONG_ASSET = "PP:E19";
string constant ERR_WRONG_DEPOSIT = "PP:E29";
string constant ERR_WRONG_PRP_SUBID = "PP:E25";
string constant ERR_ZERO_DEPOSIT = "PP:E21";
string constant ERR_ZERO_FEE_PAYER = "PP:E22";
string constant ERR_ZERO_TOKEN_EXPECTED = "PP:E23";
string constant ERR_ZERO_TOKEN_UNEXPECTED = "PP:E24";
