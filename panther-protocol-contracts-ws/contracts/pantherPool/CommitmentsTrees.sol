// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../triadTree/TriadIncrementalMerkleTrees.sol";
import { OUT_UTXOs, UTXO_SECRETS_T0 } from "../common/Constants.sol";
import { ERR_TOO_LARGE_COMMITMENTS } from "../common/ErrorMsgs.sol";

/**
 * @title CommitmentsTrees
 * @author Pantherprotocol Contributors
 * @notice Incremental Merkle trees of commitments for the `PantherPool` contract
 */
abstract contract CommitmentsTrees is TriadIncrementalMerkleTrees {
    /**
     * @dev Emitted on a new batch of Commitments
     * @param leftLeafId ID of the first leaf in the batch
     * @param hashes Commitments hashes
     * @param secrets Encoded messages for commitments receivers
     */
    event NewCommitments(
        uint256 indexed leftLeafId,
        uint256 creationTime,
        bytes32[OUT_UTXOs] hashes,
        uint256[UTXO_SECRETS_T0][OUT_UTXOs] secrets
    );

    /**
     * @notice Adds commitments to merkle tree(s) and emits events
     * @param commitments Commitments (leaves hashes) to be inserted into merkle tree(s)
     */
    function addAndEmitCommitments(
        bytes32[OUT_UTXOs] memory commitments,
        uint256[UTXO_SECRETS_T0][OUT_UTXOs] calldata secrets,
        uint256 timestamp
    ) internal {
        // Prepare hashes to insert
        for (uint256 i = 0; i < OUT_UTXOs; i++) {
            require(
                uint256(commitments[i]) < FIELD_SIZE,
                ERR_TOO_LARGE_COMMITMENTS
            );
        }

        // Insert hashes into Merkle tree(s)
        uint256 leftLeafId = insertBatch(commitments);

        // Notify UI (wallets) on new commitments
        emit NewCommitments(leftLeafId, timestamp, commitments, secrets);
    }

    // NOTE: The contract is supposed to run behind a proxy DELEGATECALLing it.
    // For compatibility on upgrades, decrease `__gap` if new variables added.
    uint256[50] private __gap;
}
