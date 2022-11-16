// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.4;

import { PoseidonT4 } from "../crypto/Poseidon.sol";

import { ERR_TOO_LARGE_PUBKEY } from "../errMsgs/PantherPoolErrMsgs.sol";
import { FIELD_SIZE } from "../crypto/SnarkConstants.sol";

abstract contract CommitmentGenerator {
    /// Generate UTXOs, these UTXOs will be used later
    /// @param pubSpendingKeyX Public Spending Key for every UTXO - 256 bit - used in circom
    /// @param pubSpendingKeyY Public Spending Key for every UTXO - 256 bit - used in circom
    /// @param scaledAmount 64 bit size - used in circom
    /// @param zAssetId 160 bit size - used in circom
    /// @param creationTime 32 bit size - used in circom
    function generateCommitment(
        uint256 pubSpendingKeyX,
        uint256 pubSpendingKeyY,
        uint64 scaledAmount,
        uint160 zAssetId,
        uint32 creationTime
    ) internal pure returns (bytes32 commitment) {
        require(
            pubSpendingKeyX <= FIELD_SIZE && pubSpendingKeyY <= FIELD_SIZE,
            ERR_TOO_LARGE_PUBKEY
        );
        // Being 160 bits and less, other input params can't exceed FIELD_SIZE
        commitment = PoseidonT4.poseidon(
            [
                bytes32(pubSpendingKeyX),
                bytes32(pubSpendingKeyY),
                bytes32(
                    (uint256(scaledAmount) << 192) |
                        (uint256(zAssetId) << 32) |
                        uint256(creationTime)
                )
            ]
        );
    }
}
