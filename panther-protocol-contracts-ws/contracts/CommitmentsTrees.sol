// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "./QuadIncrementalMerkleTrees.sol";
import { UTXO_SECRETS, TREE_DEPTH } from "./Constants.sol";
import { ERR_TOO_LARGE_COMMITMENTS } from "./ErrorMsgs.sol";

/**
 * @title CommitmentsTrees
 * @author Pantherprotocol Contributors
 * @notice Incremental Merkle trees of commitments for the `PantherPool` contract
 */
contract CommitmentsTrees is QuadIncrementalMerkleTrees {
    /**
     * @dev New Commitment event
     * @param id Commitment ID (the leaf tree ID and index packed into uint)
     * @param hash Commitment hash
     * @param secrets Encoded message for the commitment receiver
     */
    event NewCommitment(
        uint256 indexed id,
        bytes32 hash,
        uint256 time,
        uint256[UTXO_SECRETS] secrets
    );

    // NOTE: The contract is supposed to run behind a proxy DELEGATECALLing it.
    // For compatibility on upgrades, decrease `__gap` if new variables added.
    uint256[50] private __gap;

    // NOTE: No `constructor` (initialization) function needed

    /**
     * @notice Adds commitments to merkle tree(s) and emits events
     * @param commitments Commitments (leaves hashes) to be inserted into merkle tree(s)
     */
    function addAndEmitCommitments(
        bytes32[BATCH_SIZE] calldata commitments,
        uint256[UTXO_SECRETS][BATCH_SIZE] calldata secrets,
        uint256 timestamp
    ) internal {
        // Prepare hashes to insert
        // uint256[BATCH_SIZE] memory hashes;
        for (uint256 i = 0; i < BATCH_SIZE; i++) {
            require(
                uint256(commitments[i]) < FIELD_SIZE,
                ERR_TOO_LARGE_COMMITMENTS
            );
        }

        // Insert hashes into commitments Merkle trees
        (uint256 treeId, uint256 fromIndex) = insertBatch(commitments);

        // Notify UI (wallets) on new commitments
        for (uint256 i = 0; i < BATCH_SIZE; i++) {
            emit NewCommitment(
                _leafId(treeId, fromIndex + i),
                commitments[i],
                timestamp,
                secrets[i]
            );
        }
    }

    // Declared as `internal` to facilitate tests
    function _leafId(uint256 treeId, uint256 leafIndex)
        internal
        pure
        returns (uint256)
    {
        // Equivalent to `treeId * 2**TREE_DEPTH + leafIndex`
        // i.e. the number of leaves in all trees inserted before this leaf
        return (treeId << TREE_DEPTH) | leafIndex;
    }
}
