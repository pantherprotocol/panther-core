// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// Constants

uint256 constant IN_PRP_UTXOs = 1;
uint256 constant IN_UTXOs = 2 + IN_PRP_UTXOs;

uint256 constant OUT_PRP_UTXOs = 1;
uint256 constant OUT_UTXOs = 2 + OUT_PRP_UTXOs;

uint256 constant UTXO_SECRETS = 6;

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
