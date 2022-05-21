// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.4;

import "../triadTree/TriadIncrementalMerkleTrees.sol";
import "../pantherPool/v0/MerkleProofVerifier.sol";
import "../pantherPool/v0/PubKeyGenerator.sol";

contract MerkleProofVerifierTester is
    MerkleProofVerifier,
    TriadIncrementalMerkleTrees,
    PubKeyGenerator
{
    bool _verifiedProof;

    function testMerkleProof(
        uint256 leafId,
        bytes32 merkleRoot,
        bytes32 commitment,
        bytes32[TREE_DEPTH + 1] calldata pathElementss
    ) external {
        _verifiedProof = false;
        verifyMerkleProof(
            merkleRoot,
            _getTriadIndex(leafId),
            _getTriadNodeIndex(leafId),
            commitment,
            pathElementss
        );
        _verifiedProof = true;
    }

    function isProofVerified() external view returns (bool) {
        return _verifiedProof;
    }

    function generatePublicSpendingKey(uint256 privKey)
        external
        view
        returns (uint256[2] memory xy)
    {
        G1Point memory p;
        p = generatePubSpendingKey(privKey);
        xy[0] = p.x;
        xy[1] = p.y;
    }

    uint256 leftLeafId;

    function LeafId() external view returns (uint256) {
        return leftLeafId;
    }

    function internalInsertBatch(bytes32[TRIAD_SIZE] memory leaves) external {
        leftLeafId = insertBatch(leaves);
    }

    // DONT remove - it can be used to do internal testing of path-elements
    /*
    function internalInsertBatchZkp(bytes32[TRIAD_SIZE] memory leaves)
        external
    {
        (leftLeafId, pathElements) = insertBatchZkp(leaves);
    }

     // DONT remove - can be used in tests - PUT IT INSIDE TriadIncrementalMerkleTree.sol to
     // accept internal testing of path elements
    function insertBatchZkp(bytes32[TRIAD_SIZE] memory leaves)
        internal
        returns (uint256 leftLeafId, bytes32[TREE_DEPTH] memory pathElements)
    {
        leftLeafId = _nextLeafId;

        bytes32[TREE_DEPTH] memory zeros;
        populateZeros(zeros);

        // index of a "current" node (0 for the leftmost node/leaf of a level)
        uint256 nodeIndex;
        // hash (value) of a "current" node
        bytes32 nodeHash;
        // index of a "current" level (0 for leaves, increments toward root)
        uint256 level;

        // subtree from 3 leaves being inserted on `level = 0`
        nodeHash = hash(leaves[0], leaves[1], leaves[2]);
        // ... to be placed under this index on `level = 1`
        // (equivalent to `(leftLeafId % iLEAVES_NUM) / iTRIAD_SIZE`)
        nodeIndex = (leftLeafId & iLEAVES_NUM_MASK) >> iTRIAD_SIZE_BITS;

        bytes32 left;
        bytes32 right;
        for (level = 1; level < TREE_DEPTH; level++) {
            // if `nodeIndex` is, say, 25, over the iterations it will be:
            // 25, 12, 6, 3, 1, 0, 0 ...

            if (nodeIndex % 2 == 0) {
                left = nodeHash;
                right = zeros[level];
                _filledSubtrees[level] = nodeHash;
                pathElements[level - 1] = right;
            } else {
                // for a new tree, "than" block always run before "else" block
                // so `_filledSubtrees[level]` gets updated before its use
                left = _filledSubtrees[level];
                right = nodeHash;
                pathElements[level - 1] = left;
            }

            nodeHash = hash(left, right);

            // equivalent to `nodeIndex /= 2`
            nodeIndex >>= 1;
        }

        pathElements[TREE_DEPTH - 1] = nodeHash; // root

        uint256 nextLeafId = leftLeafId + iTRIAD_SIZE;
        _nextLeafId = nextLeafId;

        uint256 treeId = getTreeId(leftLeafId);
        if (_isFullTree(leftLeafId)) {
            // Switch to a new tree
            // Ignore `_filledSubtrees` old values as they are never re-used
            finalRoots[treeId] = nodeHash;
            emit AnchoredRoot(treeId, nodeHash);
        } else {
            uint256 cacheIndex = _nextLeafId2CacheIndex(nextLeafId);
            _cachedRoots[cacheIndex] = uint256(nodeHash) ^ treeId;
            emit CachedRoot(treeId, nodeHash);
        }
    }
    // In use only when zkp part is activated
    bytes32[TREE_DEPTH] pathElements;
    function PathElements() external view returns (bytes32[TREE_DEPTH] memory) {
        return pathElements;
    }
    */
}
