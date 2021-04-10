// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// Constants

uint256 constant IN_UTXOs = 2;
uint256 constant BIG_IN_UTXOs = 8;

uint256 constant SPLIT_UTXOs = 2;
uint256 constant REWARD_UTXOs = 2;
uint256 constant OUT_UTXOs = SPLIT_UTXOs + REWARD_UTXOs;

uint256 constant UTXO_SECRETS = 6;

// Also defined in scripts/writeMerkleZeroesContracts.sh
uint256 constant TREE_DEPTH = 15;

// For overflow protection and circuits optimization
uint256 constant MAX_EXT_AMOUNT = 2**120;
/*
TODO: decide if `MAX_EXT_AMOUNT` may/shall be weaken/tightened
// Addition of up to 32 numbers in circuits must not overflow
// i.e. MAX_EXT_AMOUNT*32 < snark_field_prime
uint256 public constant MAX_EXT_AMOUNT = 2**248;
//
// It works with "scalingFactor" (see EIP-1724 to get an idea)
uint256 public constant MAX_EXT_AMOUNT = 2**32;
*/

uint256 constant MAX_TIMESTAMP = 2**32;
