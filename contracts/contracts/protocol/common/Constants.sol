// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
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
// (must be less than the FIELD_SIZE)
uint256 constant MAX_EXT_AMOUNT = 2**96;
uint256 constant MAX_IN_CIRCUIT_AMOUNT = 2**96;
uint256 constant MAX_TIMESTAMP = 2**32;
uint256 constant MAX_ZASSET_ID = 2**160;

// Token types
// (not `enum` to let protocol extensions use bits, if needed)
uint8 constant ERC20_TOKEN_TYPE = 0x00;
uint8 constant ERC721_TOKEN_TYPE = 0x10;
uint8 constant ERC1155_TOKEN_TYPE = 0x11;
// defined for every tokenId rather than for all tokens on the contract
// (unsupported in the V0 and V1 of the MASP)
uint8 constant BY_TOKENID_TOKEN_TYPE = 0xFF;

// ZAsset statuses
// (not `enum` to let protocol extensions use bits, if needed)
uint8 constant zASSET_ENABLED = 0x01;
uint8 constant zASSET_DISABLED = 0x02;
uint8 constant zASSET_UNKNOWN = 0x00;

// UTXO data (opening values - encrypted and public) formats
uint8 constant UTXO_DATA_TYPE_ZERO = 0xA0; // no data (for zero UTXO)
uint8 constant UTXO_DATA_TYPE0 = 0xAA;
uint8 constant UTXO_DATA_TYPE1 = 0xAB;

// Address of the "virtual token contract" for PRPs.
// "Virtual" since PRP is NOT a token, and it does not have a token contract.
// Other contracts must use it to identify PRPs, whenever needed.
// Calculated as: keccak256('Privacy Reward Point') >> 96.
address constant PRP_VIRTUAL_CONTRACT = 0x1afa2212970b809aE15D51AF00C502D5c8eB3bAf;
// zAssetId (i.e. "token" in the UTXO preimage) of PRPs
// Other contracts must use it to encode/decode PRPs in UTXOs.
// Calculated as:
// uint160(
//   uint256(keccak256(abi.encode(uint256(PRP_VIRTUAL_CONTRACT), uint256(0)))) >> 96
// )`
uint160 constant PRP_ZASSET_ID = 0x000a1ebe17885f8603834b4c02054ce84cedf8756e;
