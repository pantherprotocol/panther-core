// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// Constants

uint256 constant IN_PRP_UTXOs = 1;
uint256 constant IN_UTXOs = 2 + IN_PRP_UTXOs;

uint256 constant OUT_PRP_UTXOs = 1;
uint256 constant OUT_UTXOs = 2 + OUT_PRP_UTXOs;

uint256 constant UTXO_SECRETS = 4;

// For overflow protection and circuits optimization
uint256 constant MAX_EXT_AMOUNT = 2**96;

uint256 constant MAX_TIMESTAMP = 2**32;
