// SPDX-License-Identifier: MIT
// Inspired by MACI project
// (https://github.com/appliedzkp/maci/blob/master/contracts/sol/IncrementalMerkleTree.sol)

pragma solidity ^0.8.4;

import { PoseidonT3, PoseidonT4 } from "./Poseidon.sol";
import "./TriadMerkleZeros.sol";
import { ERR_ZERO_ROOT, ERR_CANT_DEL_ROOT } from "./ErrorMsgs.sol";

/**
 * @title TriadIncrementalMerkleTrees
 * @author Pantherprotocol Contributors
 * @notice Incremental Merkle trees with batch insertion of 3 leaves at once
 * @dev Refer to {TriadMerkleZeros} for comments on "triad trees" used
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

    // Timestamps (when last leaves inserted) of fully populated trees
    // root => timestamp
    mapping(bytes32 => uint256) private rootHistory;

    // Recent roots of trees seen
    // cacheIndex => root
    mapping(uint256 => bytes32) private cachedRoots;

    // @dev Root permanently added to the `rootHistory`
    event AnchoredRoot(uint256 indexed treeId, bytes32 root);

    // @dev Root temporarily saved in the `cachedRoots`
    event CachedRoot(bytes32 root);

    // NOTE: No `constructor` (initialization) function needed

    // Bitmask for max number of roots cached (96 = 128/iTRIAD_SIZE*TRIAD_SIZE)
    uint256 internal constant CACHE_SIZE_MASK = 127;

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
        return cachedRoots[_nextLeafId2CacheIndex(_nextLeafId)];
    }

    /**
     * @notice Returns `true` if the given root is known
     * @param root The root queried
     * @return True if known
     */
    function isKnownRoot(bytes32 root) public view returns (bool) {
        require(root != 0, ERR_ZERO_ROOT);

        if (rootHistory[root] != 0) return true;

        // TODO: modify to iterate trough cache
        uint256 rootIndex = _nextLeafId2CacheIndex(_nextLeafId);
        return root == cachedRoots[rootIndex];
    }

    /**
     * @dev Inserts 3 leaves into the current tree, or a new one, if that's full
     * @param leaves The 3 leaves to insert (must be less than FIELD_SIZE)
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

        if (isFullTree(nextLeafId)) {
            // Switch to a new tree
            // Ignore `filledSubtrees` old values as they are never re-used
            rootHistory[nodeHash] = _timeNow();
            emit AnchoredRoot(getTreeId(leftLeafId), nodeHash);
        } else {
            cachedRoots[_nextLeafId2CacheIndex(nextLeafId)] = nodeHash;
            emit CachedRoot(nodeHash);
        }
    }

    /// internal and private functions follow

    function isFullTree(uint256 nextLeafId) internal pure returns (bool) {
        return (iLEAVES_NUM - (nextLeafId & iLEAVES_NUM_MASK)) <= iTRIAD_SIZE;
    }

    function _nextLeafId2LeavesNum(uint256 nextId)
        internal
        pure
        returns (uint256)
    {
        // equiv to `nextId / iTRIAD_SIZE * TRIAD_SIZE + nextId % iTRIAD_SIZE`
        return
            (nextId >> iTRIAD_SIZE_BITS) *
            TRIAD_SIZE +
            (nextId & iTRIAD_SIZE_MASK);
    }

    function _nextLeafId2CacheIndex(uint256 nextId)
        private
        pure
        returns (uint256)
    {
        return nextId & CACHE_SIZE_MASK;
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

    // Declared `virtual view` to facilitate tests
    function _timeNow() internal view virtual returns (uint256) {
        return block.timestamp;
    }

    // NOTE: The contract is supposed to run behind a proxy DELEGATECALLing it.
    // For compatibility on upgrades, decrease `__gap` if new variables added.
    uint256[50] private __gap;
}
