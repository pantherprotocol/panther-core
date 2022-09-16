// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.4;

import "../pantherPool/CommitmentGenerator.sol";

contract MockCommitmentGenerator is CommitmentGenerator {
    function internalGenerateCommitment(
        uint256 pubSpendingKeyX,
        uint256 pubSpendingKeyY,
        uint64 scaledAmount,
        uint160 zAssetId,
        uint32 creationTime
    ) external pure returns (bytes32 commitment) {
        return
            generateCommitment(
                pubSpendingKeyX,
                pubSpendingKeyY,
                scaledAmount,
                zAssetId,
                creationTime
            );
    }
}
