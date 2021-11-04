// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../TriadIncrementalMerkleTrees.sol";

contract MockTriadIncrementalMerkleTrees is TriadIncrementalMerkleTrees {
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
        return isFullTree(nextLeafId);
    }

    function _timeNow() internal view override returns (uint256) {
        return block.timestamp;
    }
}
