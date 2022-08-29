// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// TODO: Remove duplicated declaration after merge w/ `panther-core`

uint256 constant OUT_PRP_UTXOs = 1;
uint256 constant OUT_UTXOs = 2 + OUT_PRP_UTXOs;

// Number of 32-bit words in the (uncompressed) spending PubKey
uint256 constant PUBKEY_WORDS = 2;

// Number of 32-bit words in the ciphertext in the "type 1" message
uint256 constant CIPHERTEXT1_WORDS = 3;

// Number of elements in `pathElements`
uint256 constant PATH_ELEMENTS_NUM = 16;

// Address of the "virtual token contract" for PRPs.
// Calculated as `keccak256('Privacy Reward Point') >> 96`.
address constant PRP_VIRTUAL_CONTRACT = 0x1afa2212970b809aE15D51AF00C502D5c8eB3bAf;
