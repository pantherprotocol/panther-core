// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { PoseidonT6 } from "../crypto/Poseidon.sol";

import "../common/ErrorMsgs.sol";
import "../crypto/SnarkConstants.sol";

abstract contract CommitmentGenerator {
    // @dev Child contract must ensure the input params are less than the FIELD_SIZE
    uint256 constant MAX_AMOUNT_SIZE = 2**120;
    uint256 constant MAX_ZASSET_ID_SIZE = 2**160;
    uint256 constant MAX_CREATION_TIME_SIZE = 2**32;

    /// Generate UTXOs, these UTXOs will be used later
    /// @param pubSpendingKeyX Public Spending Key for every UTXO - 256 bit - used in circom
    /// @param pubSpendingKeyY Public Spending Key for every UTXO - 256 bit - used in circom
    /// @param amount 120 bit size - used in circom
    /// @param zAssetId 160 bit size - used in circom
    /// @param creationTime 32 bit size - used in circom
    function generateCommitment(
        uint256 pubSpendingKeyX,
        uint256 pubSpendingKeyY,
        uint256 amount,
        uint256 zAssetId,
        uint256 creationTime
    ) internal pure returns (bytes32 commitment) {

        require(pubSpendingKeyX <= FIELD_SIZE, ERR_TOO_LARGE_PUBKEY_SIZE);
        require(pubSpendingKeyY <= FIELD_SIZE, ERR_TOO_LARGE_PUBKEY_SIZE);

        require(amount <= MAX_AMOUNT_SIZE, ERR_TOO_LARGE_AMOUNT_SIZE);
        require(zAssetId <= MAX_ZASSET_ID_SIZE, ERR_TOO_LARGE_ZASSET_ID_SIZE);
        require(creationTime <= MAX_CREATION_TIME_SIZE, ERR_TOO_LARGE_CREATION_TIME_SIZE);

        commitment = PoseidonT6.poseidon(
            [
            bytes32(pubSpendingKeyX),
            bytes32(pubSpendingKeyY),
            bytes32(amount),
            bytes32(zAssetId),
            bytes32(creationTime)
            ]
        );
    }
}
