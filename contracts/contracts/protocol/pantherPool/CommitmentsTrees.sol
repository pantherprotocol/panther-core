// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.4;

import "../triadTree/TriadIncrementalMerkleTrees.sol";
import { OUT_MAX_UTXOs } from "../../common/Constants.sol";
import { ERR_TOO_LARGE_COMMITMENTS } from "../errMsgs/PantherPoolErrMsgs.sol";

/**
 * @title CommitmentsTrees
 * @author Pantherprotocol Contributors
 * @notice Incremental Merkle trees of commitments for the `PantherPool` contract
 */
abstract contract CommitmentsTrees is TriadIncrementalMerkleTrees {
    /**
     * @dev Emitted on a new batch of Commitments
     * @param leftLeafId The `leafId` of the first leaf in the batch
     * @dev `leafId = leftLeafId + 1` for the 2nd leaf (`leftLeafId + 2` for the 3rd leaf)
     * @param commitments Commitments hashes
     * @param utxoData opening values (encrypted and public) for UTXOs
     */
    event NewCommitments(
        uint256 indexed leftLeafId,
        uint256 creationTime,
        bytes32[OUT_MAX_UTXOs] commitments,
        bytes utxoData
    );

    /**
     * @notice Adds commitments to merkle tree(s) and emits events
     * @param commitments Commitments (leaves hashes) to be inserted into merkle tree(s)
     * @param msgTypes Types (i.e. formats) of the perUtxoData array elements
     * @param perUtxoData opening values (encrypted and public) for every UTXO
     * @return leftLeafId The `leafId` of the first leaf in the batch
     */
    // slither-disable-next-line dead-code
    function addAndEmitCommitments(
        bytes32[OUT_MAX_UTXOs] memory commitments,
        uint8 msgTypes,
        bytes[OUT_MAX_UTXOs] memory perUtxoData,
        uint256 timestamp
    ) internal returns (uint256 leftLeafId) {
        bytes memory utxoData = abi.encodePacked(msgTypes);

        for (uint256 i = 0; i < OUT_MAX_UTXOs; i++) {
            require(
                uint256(commitments[i]) < FIELD_SIZE,
                ERR_TOO_LARGE_COMMITMENTS
            );
            utxoData = bytes.concat(utxoData, perUtxoData[i]);
        }

        // Insert hashes into Merkle tree(s)
        leftLeafId = insertBatch(commitments);

        emit NewCommitments(leftLeafId, timestamp, commitments, utxoData);
    }

    // NOTE: The contract is supposed to run behind a proxy DELEGATECALLing it.
    // For compatibility on upgrades, decrease `__gap` if new variables added.
    uint256[50] private __gap;
}
