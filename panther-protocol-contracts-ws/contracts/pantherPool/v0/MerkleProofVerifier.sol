// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { PoseidonT3, PoseidonT4 } from "../../crypto/Poseidon.sol";
import { ERR_UNKNOWN_MERKLE_ROOT } from "../../common/ErrorMsgs.sol";
import "../../triadTree/TriadMerkleZeros.sol";

abstract contract MerkleProofVerifier {
    // @dev Number of levels in a tree excluding the root level
    // (also defined in scripts/generateTriadMerkleZeroesContracts.sh)
    uint256 private constant TREE_DEPTH = 15;

    // Number of levels in a tree including both leaf and root levels
    uint256 private constant TREE_LEVELS = TREE_DEPTH + 1;

    // Number of leaves in a branch with the root on the level 1
    uint256 private constant TRIAD_SIZE = 3;

    // Number of leaves in the fully populated tree
    uint256 private constant LEAVES_NUM = (2**(TREE_DEPTH - 1)) * TRIAD_SIZE;

    // Number of leaves in a modified triad used for leaf ID calculation
    uint256 private constant iTRIAD_SIZE = 4;
    // Bitmasks and numbers of bits for "cheaper" arithmetics
    uint256 private constant iTRIAD_SIZE_MASK = iTRIAD_SIZE - 1;
    // Number of bits for triad count
    uint256 private constant iTRIAD_SIZE_BITS = 2;

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
            revert();
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
        bytes32[3] memory pT4Input;
        if( triadIndex == iTRIAD_INDEX_LEFT) {
            pT4Input[0] = leaf;
            pT4Input[1] = proof[0];
            pT4Input[2] = proof[1];
        } else if ( triadIndex == iTRIAD_INDEX_MIDDLE ) {
            pT4Input[0] = proof[0];
            pT4Input[1] = leaf;
            pT4Input[2] = proof[1];
        } else if ( triadIndex == iTRIAD_INDEX_RIGHT ) {
            pT4Input[0] = proof[0];
            pT4Input[1] = proof[1];
            pT4Input[2] = leaf;
        }
        bytes32 nodeHash = PoseidonT4.poseidon(pT3Input);

        // [2] - Compute root
        bytes32[2] memory pT3Input;
        for (uint256 i = 0; i < proof.length-2; i++) {
            if ( (path & ( 0x1 << i ) ) == 0 ) { // computed node from left side
                // Hash(left = nodeHash, right = proofElement)
                pT3Input[0] = nodeHash;
                pT3Input[1] = proof[i+2];
            } else { // computed node from right side
                // Hash(left = proofElement, right = nodeHash)
                pT3Input[0] = proof[i+2];
                pT3Input[1] = nodeHash;
            }
            nodeHash = PoseidonT3.poseidon(pT3Input);
        }
        return nodeHash;
    }
}
