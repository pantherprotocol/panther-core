// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// Constants

uint256 constant IN_PRP_UTXOs = 1;
uint256 constant IN_UTXOs = 2 + IN_PRP_UTXOs;

uint256 constant OUT_PRP_UTXOs = 1;
uint256 constant OUT_UTXOs = 2 + OUT_PRP_UTXOs;

uint256 constant UTXO_SECRETS_T0 = 4;
uint256 constant UTXO_SECRETS_T1 = 3;

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
uint8 constant BY_ID_TOKEN_TYPE = 0xFF;

// ZAsset statuses
// (not `enum` to let protocol extensions use bits, if needed)
uint8 constant zASSET_ENABLED = 0x01;
uint8 constant zASSET_DISABLED = 0x02;
uint8 constant zASSET_UNKNOWN = 0x00;
