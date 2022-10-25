// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
// solhint-disable var-name-mixedcase
pragma solidity ^0.8.4;

import "./Hasher.sol";
import "./TriadMerkleZeros.sol";
import { ERR_ZERO_ROOT } from "../errMsgs/PantherPoolErrMsgs.sol";
import "../interfaces/IRootsHistory.sol";

/**
 * @title TriadIncrementalMerkleTrees
 * @author Pantherprotocol Contributors
 * @notice Incremental Merkle trees with batch insertion of 3 leaves at once
 * @dev Refer to {TriadMerkleZeros} for comments on "triad trees" used
 * Inspired by MACI project
 * https://github.com/appliedzkp/maci/blob/master/contracts/sol/IncrementalMerkleTree.sol
 */
contract TriadIncrementalMerkleTrees is
    TriadMerkleZeros,
    Hasher,
    IRootsHistory
{
    /**
     * @dev {treeId} is a consecutive number of trees, starting from 0.
     * @dev {leafId} of a leaf is a "modified" number of leaves inserted in all
     * tries before this leaf. It is unique across all trees, starts from 0 for
     * the 1st leaf of the 1st tree, and constantly increments like this:
     * 0,1,2,  4,5,6,  8,9,10,  12,13,14 ... (i.e. every 4th number is skipped)
     * See comments to {TriadMerkleZeros}.
     */

    // `leafId` of the next leaf to insert
    // !!! NEVER access it directly from child contracts: `internal` to ease testing only
    uint256 internal _nextLeafId;

    // Right-most elements (hashes) in the current tree per level
    // level index => hash
    mapping(uint256 => bytes32) private _filledSubtrees;

    /// @notice Roots of fully populated trees
    /// @dev treeId => root
    mapping(uint256 => bytes32) public finalRoots;

    // Recent roots of trees seen
    // cacheIndex => root ^ treeId
    mapping(uint256 => uint256) private _cachedRoots;

    // @dev Root permanently added to the `finalRoots`
    event AnchoredRoot(uint256 indexed treeId, bytes32 root);

    // @dev Root temporarily saved in the `_cachedRoots`
    event CachedRoot(uint256 indexed treeId, bytes32 root);

    // NOTE: No `constructor` (initialization) function needed

    // Max number of latest roots to cache (must be a power of 2)
    uint256 internal constant CACHED_ROOTS_NUM = 256;

    // Number of leaves in a modified triad used for leaf ID calculation
    uint256 private constant iTRIAD_SIZE = 4;
    // The number of leaves in a tree used for leaf ID calculation
    uint256 private constant iLEAVES_NUM = 2**(TREE_DEPTH - 1) * iTRIAD_SIZE;

    // Bitmasks and numbers of bits for "cheaper" arithmetics
    uint256 private constant iTRIAD_SIZE_MASK = iTRIAD_SIZE - 1;
    uint256 private constant iTRIAD_SIZE_BITS = 2;
    uint256 private constant iLEAVES_NUM_MASK = iLEAVES_NUM - 1;
    uint256 private constant iLEAVES_NUM_BITS =
        TREE_DEPTH - 1 + iTRIAD_SIZE_BITS;
    uint256 private constant CACHE_SIZE_MASK =
        CACHED_ROOTS_NUM * iTRIAD_SIZE - 1;

    /**
     * @notice Returns the number of leaves inserted in all trees so far
     */
    function leavesNum() external view returns (uint256) {
        return _nextLeafId2LeavesNum(_nextLeafId);
    }

    /**
     * @notice Returns `treeId` of the current tree
     */
    function curTree() external view returns (uint256) {
        return getTreeId(_nextLeafId);
    }

    /**
     * @notice Returns `treeId` of the given leaf's tree
     */
    function getTreeId(uint256 leafId) public pure returns (uint256) {
        // equivalent to `leafId / iLEAVES_NUM`
        return leafId >> iLEAVES_NUM_BITS;
    }

    /**
     * @notice Returns `leafIndex` (index in the tree) of the given leaf
     */
    function getLeafIndex(uint256 leafId) public pure returns (uint256) {
        unchecked {
            // equiv to `leafId % LEAVES_NUM`
            uint256 iIndex = leafId & iLEAVES_NUM_MASK; // throws away tree-id bits
            uint256 fullTriadsNum = (iIndex + 1) >> iTRIAD_SIZE_BITS; // computes index of triad node in the tree
            return iIndex - fullTriadsNum; // start index of first leaf in the triad
        }
    }

    /**
     * @notice Returns the root of the current tree and its index in cache
     */
    function curRoot()
        external
        view
        returns (bytes32 root, uint256 cacheIndex)
    {
        // Return zero root and index if the current tree is empty
        uint256 nextLeafId = _nextLeafId;
        if (_isEmptyTree(nextLeafId)) return (ZERO_ROOT, 0);

        // Return cached values otherwise
        uint256 treeId = getTreeId(nextLeafId);
        cacheIndex = _nextLeafId2CacheIndex(nextLeafId);
        uint256 v = _cachedRoots[cacheIndex];
        root = bytes32(v ^ treeId);
    }

    /// @inheritdoc IRootsHistory
    function isKnownRoot(
        uint256 treeId,
        bytes32 root,
        uint256 cacheIndexHint
    ) public view override returns (bool) {
        require(root != 0, ERR_ZERO_ROOT);

        // if hint provided, use hint
        if (cacheIndexHint != 0)
            return _isCorrectCachedRoot(treeId, root, cacheIndexHint);

        // then, check the history
        if (finalRoots[treeId] == root) return true;

        // finally, look in cache, starting from the current root
        uint256 leafId = _nextLeafId;
        unchecked {
            uint256 i = CACHED_ROOTS_NUM;
            while ((leafId >= iTRIAD_SIZE) && (i != 0)) {
                i -= 1;
                // Skip the last triad in a tree (i.e. the full tree root)
                if (leafId & iLEAVES_NUM_MASK == 0) continue;
                uint256 cacheIndex = _nextLeafId2CacheIndex(leafId);
                if (_isCorrectCachedRoot(treeId, root, cacheIndex)) return true;
                leafId -= iTRIAD_SIZE;
            }
        }
        return false;
    }

    /**
     * @dev Inserts 3 leaves into the current tree, or a new one, if that's full
     * @param leaves The 3 leaves to insert (must be less than SNARK_SCALAR_FIELD)
     * @return leftLeafId The `leafId` of the first leaf from 3 inserted
     */
    function insertBatch(bytes32[TRIAD_SIZE] memory leaves)
        internal
        returns (uint256 leftLeafId)
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
            } else {
                // for a new tree, "than" block always run before "else" block
                // so `_filledSubtrees[level]` gets updated before its use
                left = _filledSubtrees[level];
                right = nodeHash;
            }

            nodeHash = hash(left, right);

            // equivalent to `nodeIndex /= 2`
            nodeIndex >>= 1;
        }

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

    /// private functions follow (some of them made `internal` to ease testing)

    function _isFullTree(uint256 leftLeafId) internal pure returns (bool) {
        unchecked {
            return
                (iLEAVES_NUM - (leftLeafId & iLEAVES_NUM_MASK)) <= iTRIAD_SIZE;
        }
    }

    function _isEmptyTree(uint256 nextLeafId) internal pure returns (bool) {
        return (nextLeafId & iLEAVES_NUM_MASK) == 0;
    }

    function _nextLeafId2LeavesNum(
        uint256 nextLeafId // declared as `internal` to facilitate testing
    ) internal pure returns (uint256) {
        // equiv to `nextLeafId / iTRIAD_SIZE * TRIAD_SIZE + nextLeafId % iTRIAD_SIZE`
        unchecked {
            return
                (nextLeafId >> iTRIAD_SIZE_BITS) *
                TRIAD_SIZE +
                (nextLeafId & iTRIAD_SIZE_MASK);
        }
    }

    // Returns `triadIndex` index in the triad-node of the given leaf = { 0, 1, 2 }
    function _getTriadIndex(uint256 leafId) internal pure returns (uint256) {
        return getLeafIndex(leafId) % TRIAD_SIZE;
    }

    // Returns `triadNodeIndex` index of the triad-node of the given leaf
    // This index is the path to this node - used by anyone who needs the path
    function _getTriadNodeIndex(uint256 leafId)
        internal
        pure
        returns (uint256)
    {
        unchecked {
            // equiv to `leafId % LEAVES_NUM`
            uint256 iIndex = leafId & iLEAVES_NUM_MASK; // throws away tree-id bits
            uint256 fullTriadsNum = (iIndex + 1) >> iTRIAD_SIZE_BITS; // computes index of triad node in the tree
            return fullTriadsNum;
        }
    }

    // nextLeafId must be even
    function _nextLeafId2CacheIndex(uint256 nextLeafId)
        private
        pure
        returns (uint256)
    {
        // equiv to `nextLeafId % (CACHED_ROOTS_NUM * iTRIAD_SIZE) + 1`
        return (nextLeafId & CACHE_SIZE_MASK) | 1;
    }

    function _isCorrectCachedRoot(
        uint256 treeId,
        bytes32 root,
        uint256 cacheIndex
    ) private view returns (bool) {
        uint256 v = _cachedRoots[cacheIndex];
        return v == (uint256(root) ^ treeId);
    }

    // NOTE: The contract is supposed to run behind a proxy DELEGATECALLing it.
    // For compatibility on upgrades, decrease `__gap` if new variables added.
    // slither-disable-next-line unused-state
    uint256[50] private __gap;
}
