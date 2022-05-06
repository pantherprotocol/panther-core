// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { PoseidonT3, PoseidonT4 } from "../../crypto/Poseidon.sol";
import { ERR_UNKNOWN_MERKLE_ROOT } from "../../common/ErrorMsgs.sol";
import "../../triadTree/TriadMerkleZeros.sol";

abstract contract MerkleProofVerifier {
    // @dev Number of levels in a tree excluding the root level
    // (also defined in scripts/generateTriadMerkleZeroesContracts.sh)
    uint256 private constant TREE_DEPTH = 15;

    //t |bH  bL| Subtree
    //--|------|------------
    //0 | 0  0 | hash(C,L,R)
    //1 | 0  1 | hash(L,C,R)
    //2 | 1  0 | hash(L,R,C)
    //3 | 1  1 | Not allowed
    //--|------|------------
    // Current leaf index in thiad is (C,L,R)
    uint256 private constant iTRIAD_INDEX_LEFT = 0x0;
    // Current leaf index in thiad is (L,C,R)
    uint256 private constant iTRIAD_INDEX_MIDDLE = 0x1;
    // Current leaf index in thiad is (L,R,C)
    uint256 private constant iTRIAD_INDEX_RIGHT = 0x2;
    // Forbidden triad value
    uint256 private constant iTRIAD_INDEX_FORBIDDEN = 0x3;

    /// @param merkleRoot
    /// @param triadIndex - index inside triad = { 0, 1, 2 }
    /// @param triadNodeIndex - index of triad hash ( c0,c1,c2 ) in the tree
    /// @param leaf - commitment leaf value
    /// @param pathElements - TREE_DEPTH + 1 elements - c1,c2 & path-elements
    /**
     * @dev Returns true if a `leaf` can be proved to be a part of a Merkle tree
     * defined by `root`. For this, a `proof` must be provided, containing
     * sibling hashes on the branch from the leaf to the root of the tree.
     */
    function verifyMerkleProof(
        bytes32 merkleRoot,
        uint256 triadIndex,
        uint256 triadNodeIndex,
        bytes32 leaf,
        bytes32[TREE_DEPTH + 1] calldata pathElements
    ) internal view {
        // revert if verification fails
        if ( processProof ( pathElements, leaf, triadNodeIndex, triadIndex ) != merkleRoot ) {
            revert("Incorrect Merkle Proof");
        }
    }

    /**
     * @dev Returns the rebuilt hash obtained by traversing a Merklee tree up
     * from `leaf` using `proof`. A `proof` is valid if and only if the rebuilt
     * hash matches the root of the tree.
     */
    function processProof(
        bytes32[TREE_DEPTH+1] memory proof,
        bytes32 leaf,
        uint256 path,
        uint256 triadIndex
    ) private pure returns (bytes32) {
        // [0] - Require
        require( triadIndex != iTRIAD_INDEX_FORBIDDEN, "Triad index can't be b`11`" );

        // [1] - Compute zero level hash
        bytes32 nodeHash;
        if( triadIndex == iTRIAD_INDEX_LEFT) {
            nodeHash = PoseidonT4.poseidon([leaf,proof[0],proof[1]]);
        } else if ( triadIndex == iTRIAD_INDEX_MIDDLE ) {
            nodeHash = PoseidonT4.poseidon([proof[0],leaf,proof[1]]);
        } else if ( triadIndex == iTRIAD_INDEX_RIGHT ) {
            nodeHash = PoseidonT4.poseidon([proof[0],proof[1],leaf]);
        }

        // [2] - Compute root
        for (uint8 level = 2; level < proof.length; level++) {
            bool isLeftNode;
            unchecked {
                isLeftNode = ((path & ( 0x1 << ( level - 2 ) ) ) == 0);
            }
            if ( isLeftNode ) { // computed node from left side
                // Hash(left = nodeHash, right = proofElement)
                nodeHash = PoseidonT3.poseidon([nodeHash,proof[level]]);
            } else { // computed node from right side
                // Hash(left = proofElement, right = nodeHash)
                nodeHash = PoseidonT3.poseidon([proof[level],nodeHash]);
            }
        }
        return nodeHash;
    }
}
