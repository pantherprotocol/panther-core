// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// Constants

uint256 constant IN_PRP_UTXOs = 1;
uint256 constant IN_UTXOs = 2 + IN_PRP_UTXOs;

uint256 constant OUT_PRP_UTXOs = 1;
uint256 constant OUT_UTXOs = 2 + OUT_PRP_UTXOs;

// Number of 32-bit words in the `secrets` of the `NewCommitment` events
uint256 constant UTXO_SECRETS = 4;
// Number of 32-bit words in the ciphertext in the "type 0" message
uint256 constant CIPERTEXT0_WORDS = 4;
// Number of 32-bit words in the ciphertext in the "type 1" message
uint256 constant CIPHERTEXT1_WORDS = 3;

// For overflow protection and circuits optimization
uint256 constant MAX_EXT_AMOUNT = 2**96;

uint256 constant MAX_TIMESTAMP = 2**32;

// Token types
// (not `enum` to let protocol extensions use bits, if needed)
uint8 constant ERC20_TOKEN_TYPE = 0x00;
uint8 constant ERC721_TOKEN_TYPE = 0x10;
uint8 constant ERC1155_TOKEN_TYPE = 0x11;
// for PRP (quasi-token) only
uint8 constant PRP_TOKEN_TYPE = 0xFE;
// defined for every tokenId rather than for all tokens on the contract
// (unsupported in the V0 and V1 of the MASP)
uint8 constant BY_TOKENID_TOKEN_TYPE = 0xFF;

// ZAsset statuses
// (not `enum` to let protocol extensions use bits, if needed)
uint8 constant zASSET_ENABLED = 0x01;
uint8 constant zASSET_DISABLED = 0x02;
uint8 constant zASSET_UNKNOWN = 0x00;
