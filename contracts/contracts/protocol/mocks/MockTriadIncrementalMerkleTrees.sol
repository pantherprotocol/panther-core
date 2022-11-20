// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.16;

import "../triadTree/TriadIncrementalMerkleTrees.sol";

// solhint-disable var-name-mixedcase
// solhint-disable no-empty-blocks
// solhint-disable func-name-mixedcase
contract MockTriadIncrementalMerkleTrees is TriadIncrementalMerkleTrees {
    event InternalInsertBatch(uint256 leftLeafId);

    function internal_TREE_DEPTH() external pure returns (uint256) {
        return TREE_DEPTH;
    }

    function internal_ZERO_VALUE() external pure returns (bytes32) {
        return ZERO_VALUE;
    }

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
}
