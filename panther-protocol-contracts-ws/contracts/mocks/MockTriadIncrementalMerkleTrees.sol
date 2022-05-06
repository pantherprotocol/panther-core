// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.4;

import "../triadTree/TriadIncrementalMerkleTrees.sol";
import "../pantherPool/v0/MerkleProofVerifier.sol";

contract MockTriadIncrementalMerkleTrees is TriadIncrementalMerkleTrees, MerkleProofVerifier {
    event InternalInsertBatch(uint256 leftLeafId);

    function internalInsertBatch(bytes32[TRIAD_SIZE] memory leaves) external {
        uint256 leftLeafId = insertBatch(leaves);
        emit InternalInsertBatch(leftLeafId);
    }

    function internalIsFullTree(uint256 nextLeafId)
        external
        pure
        returns (bool)
    {
        return _isFullTree(nextLeafId);
    }

    function internalNextLeafId2LeavesNum(uint256 nextId)
        external
        pure
        returns (uint256)
    {
        return _nextLeafId2LeavesNum(nextId);
    }



    // This function fakes just the '_nextLeafId', but it does not update the history of roots.
    // If applied to the empty tree, equivalent to inserting ZERO leaves (but the history is empty).
    // !!! If applied to a non-empty tree, or leaves "really" inserted after a "fake" insertion,
    // the tree root will be incorrect.
    function fakeNextLeafId(uint256 fakeId) external {
        require((fakeId % 4) == 0, "fakeId must be a multiple of 4");
        _nextLeafId = fakeId;
    }

    bool _verifiedProof;

    function testMerkleProof(
        uint256 leafId,
        bytes32 merkleRoot,
        bytes32 commitment,
        bytes32[TREE_DEPTH + 1] calldata pathElements
    ) external {
        _verifiedProof = false;
        verifyMerkleProof(
            merkleRoot,
            getTriadIndex(leafId),
            getTriadNodeIndex(leafId),
            commitment,
            pathElements
        );
        _verifiedProof = true;
    }

    function isProofVerified()
    external
    view
    returns (bool)
    {
        return _verifiedProof;
    }

    bytes32[TREE_DEPTH] pathElements;

    uint256 leftLeafId;

    // DONT remove - it can be used
    function internalInsertBatchZkp(bytes32[TRIAD_SIZE] memory leaves) external {
        (leftLeafId,pathElements) = insertBatchZkp(leaves);
    }
    function LeafId()
    external
    view
    returns (uint256)
    {
        return leftLeafId;
    }

    function PathElements()
    external
    view
    returns (bytes32[TREE_DEPTH] memory)
    {
        return pathElements;
    }
}
