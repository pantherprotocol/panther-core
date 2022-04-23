// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
// solhint-disable var-name-mixedcase
pragma solidity ^0.8.4;

import { PoseidonT3, PoseidonT4 } from "../crypto/Poseidon.sol";
import "./TriadMerkleZeros.sol";
import { ERR_ZERO_ROOT, ERR_CANT_DEL_ROOT } from "../common/ErrorMsgs.sol";

/**
 * @title TriadIncrementalMerkleTrees
 * @author Pantherprotocol Contributors
 * @notice Incremental Merkle trees with batch insertion of 3 leaves at once
 * @dev Refer to {TriadMerkleZeros} for comments on "triad trees" used
 * Inspired by MACI project
 * https://github.com/appliedzkp/maci/blob/master/contracts/sol/IncrementalMerkleTree.sol
 */
contract TriadIncrementalMerkleTrees is TriadMerkleZeros {
    /**
     * @dev {treeId} is a consecutive number of trees, starting from 0.
     * @dev {leafId} of a leaf is a "modified" number of leaves inserted in all
     * tries before this leaf. It is unique across all trees, starts from 0 for
     * the 1st leaf of the 1st tree, and constantly increments like this:
     * 0,1,2,  4,5,6,  8,9,10,  12,13,14 ... (i.e. every 4th number is skipped)
     * See comments to {TriadMerkleZeros}.
     */

    // `leafId` of the next leaf to insert
    uint256 private _nextLeafId;

    // Right-most elements (hashes) in the current tree per level
    // level index => hash
    mapping(uint256 => bytes32) private filledSubtrees;

    /// @notice Roots of fully populated trees
    /// @dev treeId => root
    mapping(uint256 => bytes32) public finalRoots;

    // Recent roots of trees seen
    // cacheIndex => root ^ treeId
    mapping(uint256 => uint256) private cachedRoots;

    // @dev Root permanently added to the `finalRoots`
    event AnchoredRoot(uint256 indexed treeId, bytes32 root);

    // @dev Root temporarily saved in the `cachedRoots`
    event CachedRoot(uint256 treeId, bytes32 root);

    // NOTE: No `constructor` (initialization) function needed

    // Max number of latest roots to cache (must be a power of 2)
    uint256 internal constant CACHED_ROOTS_NUM = 4;

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
     * @notice Returns `treeId` of the given leaf tree
     */
    function getTreeId(uint256 leafId) public pure returns (uint256) {
        // equivalent to `leafId / iLEAVES_NUM`
        return leafId >> iLEAVES_NUM_BITS;
    }

    /**
     * @notice Returns the root of the current tree
     */
    function curRoot() external view returns (bytes32) {
        uint256 nextLeafId = _nextLeafId;
        uint256 leavesInTreeNum = nextLeafId & iLEAVES_NUM_MASK;
        if (leavesInTreeNum == 0) return ZERO_ROOT;

        uint256 treeId = getTreeId(nextLeafId);
        uint256 v = cachedRoots[_nextLeafId2CacheIndex(nextLeafId)];
        return bytes32(v ^ treeId);
    }

    /**
     * @notice Returns `true` if the given root of the given tree is known
     */
    function isKnownRoot(uint256 treeId, bytes32 root)
        public
        view
        returns (bool)
    {
        require(root != 0, ERR_ZERO_ROOT);

        // first, check the history
        bytes32 _root = finalRoots[treeId];
        if (_root == root) return true;

        // then, look in cache
        for (uint256 i = 0; i < CACHED_ROOTS_NUM; i++) {
            uint256 cacheIndex = i * iTRIAD_SIZE;
            uint256 v = cachedRoots[cacheIndex];
            if (v == treeId ^ uint256(root)) return true;
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
        nodeHash = poseidon(leaves[0], leaves[1], leaves[2]);
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
                filledSubtrees[level] = nodeHash;
            } else {
                // for a new tree, "than" block always run before "else" block
                // so `filledSubtrees[level]` gets updated before its use
                left = filledSubtrees[level];
                right = nodeHash;
            }

            nodeHash = poseidon(left, right);

            // equivalent to `nodeIndex /= 2`
            nodeIndex >>= 1;
        }

        uint256 nextLeafId = leftLeafId + iTRIAD_SIZE;
        _nextLeafId = nextLeafId;

        uint256 treeId = getTreeId(leftLeafId);
        if (isFullTree(leftLeafId)) {
            // Switch to a new tree
            // Ignore `filledSubtrees` old values as they are never re-used
            finalRoots[treeId] = nodeHash;
            emit AnchoredRoot(treeId, nodeHash);
        } else {
            uint256 cacheIndex = _nextLeafId2CacheIndex(nextLeafId);
            cachedRoots[cacheIndex] = uint256(nodeHash) ^ treeId;
            emit CachedRoot(treeId, nodeHash);
        }
    }

    /// internal and private functions follow

    function getNextLeafId() internal view returns (uint256) {
        return _nextLeafId;
    }

    function isFullTree(uint256 leftLeafId) internal pure returns (bool) {
        return (iLEAVES_NUM - (leftLeafId & iLEAVES_NUM_MASK)) <= iTRIAD_SIZE;
    }

    function _nextLeafId2LeavesNum(
        uint256 nextLeafId // declared as `internal` to facilitate testing
    ) internal pure returns (uint256) {
        // equiv to `nextLeafId / iTRIAD_SIZE * TRIAD_SIZE + nextLeafId % iTRIAD_SIZE`
        return
            (nextLeafId >> iTRIAD_SIZE_BITS) *
            TRIAD_SIZE +
            (nextLeafId & iTRIAD_SIZE_MASK);
    }

    function _nextLeafId2CacheIndex(uint256 nextLeafId)
        private
        pure
        returns (uint256)
    {
        return nextLeafId & CACHE_SIZE_MASK;
    }

    function poseidon(bytes32 left, bytes32 right)
        private
        pure
        returns (bytes32)
    {
        bytes32[2] memory input;
        input[0] = left;
        input[1] = right;
        return PoseidonT3.poseidon(input);
    }

    function poseidon(
        bytes32 left,
        bytes32 mid,
        bytes32 right
    ) private pure returns (bytes32) {
        bytes32[3] memory input;
        input[0] = left;
        input[1] = mid;
        input[2] = right;
        return PoseidonT4.poseidon(input);
    }

    // NOTE: The contract is supposed to run behind a proxy DELEGATECALLing it.
    // For compatibility on upgrades, decrease `__gap` if new variables added.
    uint256[50] private __gap;
}
