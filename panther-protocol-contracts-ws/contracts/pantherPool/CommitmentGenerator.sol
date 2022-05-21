// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { PoseidonT6 } from "../crypto/Poseidon.sol";

import { MAX_IN_CIRCUIT_AMOUNT, MAX_TIMESTAMP } from "../common/Constants.sol";
import { ERR_TOO_LARGE_AMOUNT, ERR_TOO_LARGE_PUBKEY } from "../common/ErrorMsgs.sol";
import { FIELD_SIZE } from "../crypto/SnarkConstants.sol";

abstract contract CommitmentGenerator {
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
        uint160 zAssetId,
        uint32 creationTime
    ) internal pure returns (bytes32 commitment) {
        require(
            pubSpendingKeyX <= FIELD_SIZE && pubSpendingKeyY <= FIELD_SIZE,
            ERR_TOO_LARGE_PUBKEY
        );
        require(amount <= MAX_IN_CIRCUIT_AMOUNT, ERR_TOO_LARGE_AMOUNT);
        // amount, zAssetId, and creationTime do not exceed FIELD_SIZE

        commitment = PoseidonT6.poseidon(
            [
                bytes32(pubSpendingKeyX),
                bytes32(pubSpendingKeyY),
                bytes32(amount),
                bytes32(uint256(zAssetId)),
                bytes32(uint256(creationTime))
            ]
        );
    }
}
