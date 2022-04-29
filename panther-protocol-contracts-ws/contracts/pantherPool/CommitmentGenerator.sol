// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { PoseidonT6 } from "../crypto/Poseidon.sol";

abstract contract CommitmentGenerator {
    // @dev Child contract must ensure the input params are less than the FIELD_SIZE
    function generateCommitment(
        uint256 pubSpendingKeyX,
        uint256 pubSpendingKeyY,
        uint256 amount,
        uint256 zAssetId,
        uint256 creationTime
    ) internal pure returns (bytes32 commitment) {
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
