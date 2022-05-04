// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// ZAssetRegistry contract
string constant ERR_ASSET_ALREADY_REGISTERED = "AR:E1";
string constant ERR_UNKNOWN_ASSET = "AR:E2";
string constant ERR_WRONG_ASSET_STATUS = "AR:E3";
string constant ERR_ZERO_TOKEN_ADDRESS = "AR:E4";

// CommitmentsTrees contract
string constant ERR_TOO_LARGE_COMMITMENTS = "CT:E1"; // commitment exceeds maximum scalar field size

// Registry contract
string constant ERR_INVALID_PUBKEYS = "RG:E1"; // Unexpected format of Pub Keys

// PantherPool contract
string constant ERR_DEPOSIT_OVER_LIMIT = "PP:E1";
string constant ERR_DEPOSIT_FROM_ZERO_ADDRESS = "PP:E2";
string constant ERR_EXPIRED_TX_TIME = "PP:E3";
string constant ERR_INVALID_JOIN_INPUT = "PP:E4";
string constant ERR_INVALID_PROOF = "PP:E5";
string constant ERR_MISMATCHED_ARR_LENGTH = "PP:E6";
string constant ERR_PLUGIN_FAILURE = "PP:E7";
string constant ERR_SPENT_NULLIFIER = "PP:E8";
string constant ERR_TOO_EARLY_CREATED_AT = "PP:E9";
string constant ERR_TOO_LARGE_AMOUNT = "PP:E10";
string constant ERR_TOO_LARGE_COMMITMENT = "PP:E11";
string constant ERR_TOO_LARGE_NULLIFIER = "PP:E12";
string constant ERR_TOO_LARGE_ROOT = "PP:E13";
string constant ERR_TOO_LARGE_TIME = "PP:E14";
string constant ERR_UNKNOWN_MERKLE_ROOT = "PP:E15";
string constant ERR_WITHDRAW_OVER_LIMIT = "PP:E16";
string constant ERR_WITHDRAW_TO_ZERO_ADDRESS = "PP:E17";
string constant ERR_WRONG_ASSET = "PP:E18";
string constant ERR_ZERO_FEE_PAYER = "PP:E19";
string constant ERR_ZERO_TOKEN_EXPECTED = "PP:E20";
string constant ERR_ZERO_TOKEN_UNEXPECTED = "PP:E21";

// (Specific to) PantherPoolV0 contract
string constant ERR_TOO_EARLY_EXIT = "P0:E1";
string constant ERR_TOO_LARGE_LEAFID = "P0:E2";
string constant ERR_TOO_LARGE_PRIVKEY = "P0:E3";

// PrpGrantor contract
string constant ERR_ZERO_CURATOR_ADDR = "GR:E1";
string constant ERR_ZERO_GRANTEE_ADDR = "GR:E2";
string constant ERR_GRANT_TYPE_EXISTS = "GR:E3";
string constant ERR_UNEXPECTED_GRANT_RECEIPIENT = "GR:E4";
string constant ERR_LOW_GRANT_BALANCE = "GR:E5";
string constant ERR_UKNOWN_GRANT_TYPE = "GR:E6";
string constant ERR_TOO_LARGE_GRANT_AMOUNT = "GR:E6";
string constant ERR_UNDEF_GRANT = "GR:E7";
string constant ERR_UNAUTHORIZED_CALL = "GR:Unauthorized";

// TriadIncrementalMerkleTrees contract
string constant ERR_ZERO_ROOT = "TT:E1"; // merkle tree root can not be zero
