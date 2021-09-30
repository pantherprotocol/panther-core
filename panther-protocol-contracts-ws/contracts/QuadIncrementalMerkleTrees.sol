// SPDX-License-Identifier: MIT
// Inspired by
//   MACI (https://github.com/appliedzkp/maci/blob/master/contracts/sol/IncrementalMerkleTree.sol)

pragma solidity ^0.8.4;

import { PoseidonT3 } from "./Poseidon.sol";
import { MerkleZeros } from "./MerkleZeros.sol";
import { ERR_ZERO_ROOT, ERR_CANT_DEL_ROOT } from "./ErrorMsgs.sol";

/**
 * @title QuadIncrementalMerkleTrees
 * @author Pantherprotocol Contributors
 * @notice Incremental Merkle trees with batch insertion of 4 leaves at once
 */
contract QuadIncrementalMerkleTrees is MerkleZeros {
    // Four leaves must be inserted in a tree at once
    uint256 internal constant BATCH_SIZE = 4;

    // @dev The number of inserted leaves in all trees
    uint256 public leavesNum;

    // @dev The ID of the current tree (0 for the 1st tree, increments by 1)
    uint256 public curTree;

    // @dev The Merkle root of the current tree
    bytes32 public curRoot;

    // Right-most elements in the current tree per level
    // level index => hash
    mapping(uint256 => bytes32) private filledSubtrees;

    // ("Flagged") timestamps of already seen Merkle tree roots
    // Timestamps are rounded down (i.e. "flagged" is set in the lowest bit) to:
    // - odd number (flag == 1) for roots of fully populated trees
    // - even number (flag == 0) for roots of partially populated trees
    // root => flagged timestamp
    mapping(bytes32 => uint256) private rootHistory;

    // @dev Root of partially populated tree (temporarily) added to `rootHistory`
    event InterimRoot(bytes32 root);
    // @dev Root of partially populated tree removed from `rootHistory`
    event DeletedRoot(bytes32 root);
    // @dev Root of fully populated tree (permanently) added to `rootHistory`
    event FinalRoot(bytes32 root, uint256 indexed treeId);

    // Minimal time a root must be kept in `rootHistory` within
    uint256 internal constant HISTORY_EXPIRE_SECONDS = 3600 * 24;

    // NOTE: No `constructor` (initialization) function needed

    /**
     * @notice If a root of a Merkle tree is already known
     * @param root The root queried
     * @return True if the root is known
     */
    function isKnownRoot(bytes32 root) public view returns (bool) {
        require(root != 0, ERR_ZERO_ROOT);
        return rootHistory[root] != 0 || root == curRoot;
    }

    /**
     * @dev Inserts four leaves into the Merkle tree
     * @param leaves Four leaves to insert (must be less than FIELD_SIZE)
     * @return treeId The ID of a tree the laves have been inserted into
     * @return fromIndex The index of the first inserted leaf
     */
    function insertBatch(bytes32[BATCH_SIZE] memory leaves)
        internal
        returns (uint256 treeId, uint256 fromIndex)
    {
        /* Example of insertion of leaves #12..15 into a tree of depth 5
        - Index of a level, `level`, starts from 0 on the leaf level
        - Index of a node/leaf, `nodeIndex`, starts from 0 for every level
        - Numbers shown in nodes/leaves bellow are `nodeIndex`
        - Numbers in [] are values of `level` over iterations (see bellow)
        - Numbers in {} are values of `nodeIndex` over iterations
        - Before the insertion, `leavesNum` is 12, the tree is vacant
        - After the insertion, `leavesNum` is 16, the tree is fully populated
        - New (another) insertion switches to a new tree

        [4]{0}                                 0
                                               |
        [3]{1}                 0-------------------------------1
                               |                               |
        [2]{3}          0---------------1                2--------------3
                        |               |                |              |
                    0-------1       2-------3        4------5       6-------7
                   / \     / \     / \     / \     / \     / \     / \     / \
                  0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
        */

        bool isFullTree;
        (treeId, fromIndex, isFullTree) = prepareBatchInsertion();

        bytes32 nodeHash;
        // Hash of the subtree from four leaves being inserted ...
        {
            bytes32 _left = poseidon(leaves[0], leaves[1]);
            bytes32 _right = poseidon(leaves[2], leaves[3]);
            nodeHash = poseidon(_left, _right);
        }
        // ... to be placed on the level #2 under this index
        uint256 nodeIndex = fromIndex % BATCH_SIZE;

        bytes32[TREE_DEPTH] memory zeros;
        populateZeros(zeros);

        bytes32 left;
        bytes32 right;
        for (uint256 level = 2; level < TREE_DEPTH; level++) {
            // if `nodeIndex` is 25, for instance, over the iterations it will
            // look like this: 25, 12, 6, 3, 1, 0, 0 ...

            if (nodeIndex % 2 == 0) {
                left = nodeHash;
                right = zeros[level];

                filledSubtrees[level] = nodeHash;
            } else {
                // for a new tree, "then" block always run before this block
                // so `filledSubtrees[level]` gets updated before its use
                left = filledSubtrees[level];
                right = nodeHash;
            }

            nodeHash = poseidon(left, right);

            // equivalent to `nodeIndex /= 2`
            nodeIndex >>= 1;
        }

        curRoot = nodeHash;

        uint256 flaggedTime;
        if (isFullTree) {
            flaggedTime |= 0x01; // to odd
            emit FinalRoot(nodeHash, treeId);
        } else {
            flaggedTime = (_blockTimestamp() >> 1) << 1; // to even
            emit InterimRoot(nodeHash);
        }
        rootHistory[nodeHash] = flaggedTime;
    }

    /**
     * @dev Delete roots from the `rootHistory`
     * Expired roots of partially populated trees only may be deleted
     * @param roots List of roots to delete
     */
    function deleteInterimRoots(bytes32[] memory roots) internal {
        for (uint256 i = 0; i < roots.length; i++) {
            uint256 flaggedTime = rootHistory[roots[i]];

            // "fresh" roots and ...
            bool isOldRoot = _blockTimestamp() >
                flaggedTime + _expireInterval();
            // ... roots of fully populated trees ...
            bool isInterimRoot = (flaggedTime & 0x01) == 0;
            // ... may not be deleted
            require(isOldRoot && isInterimRoot, ERR_CANT_DEL_ROOT);

            delete rootHistory[roots[i]];
            emit DeletedRoot(roots[i]);
        }
    }

    function prepareBatchInsertion()
        private
        returns (
            uint256 treeId,
            uint256 fromIndex,
            bool isFullTree
        )
    {
        treeId = curTree;
        uint256 _leavesNum = leavesNum;
        fromIndex = _leavesNum % MAX_LEAVES_NUM;
        leavesNum = _leavesNum + BATCH_SIZE;

        if (fromIndex + BATCH_SIZE > MAX_LEAVES_NUM) {
            // Switch to a new tree
            // Ignore `curRoot` old value as the calling function updates it
            // Ignore `filledSubtrees` old values as they are never re-used
            curTree = treeId = treeId + 1;
            fromIndex = 0;
        }

        isFullTree = (MAX_LEAVES_NUM - fromIndex) <= BATCH_SIZE;
    }

    function poseidon(bytes32 _left, bytes32 _right)
        private
        pure
        returns (bytes32)
    {
        bytes32[2] memory input;
        input[0] = _left;
        input[1] = _right;
        return PoseidonT3.poseidon(input);
    }

    // Functions bellow are declared to facilitate tests

    function _expireInterval() internal virtual returns (uint256) {
        return HISTORY_EXPIRE_SECONDS;
    }

    function _blockTimestamp() internal virtual returns (uint256) {
        return block.timestamp;
    }
}
