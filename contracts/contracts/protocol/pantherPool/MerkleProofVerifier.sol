// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.16;

import { PoseidonT3, PoseidonT4 } from "../crypto/Poseidon.sol";
import "../errMsgs/PantherPoolErrMsgs.sol";
import "../triadTree/TriadIncrementalMerkleTrees.sol";

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
    // Current leaf index in triad is (C,L,R)
    uint256 private constant iTRIAD_INDEX_LEFT = 0x0;
    // Current leaf index in triad is (L,C,R)
    uint256 private constant iTRIAD_INDEX_MIDDLE = 0x1;
    // Current leaf index in triad is (L,R,C)
    uint256 private constant iTRIAD_INDEX_RIGHT = 0x2;
    // Forbidden triad value in tria is `11`
    uint256 private constant iTRIAD_INDEX_FORBIDDEN = 0x3;

    /// @param merkleRoot - verify checked to this hash
    /// @param triadIndex - index inside triad = { 0, 1, 2 }
    /// @param triadNodeIndex - index of triad hash ( c0,c1,c2 ) in the tree - Triad contract insures its is in range
    /// @param leaf - commitment leaf value
    /// @param pathElements - TREE_DEPTH + 1 elements - c1,c2 & path-elements
    /// @dev Returns true if a `leaf` can be proved to be a part of a Merkle tree
    /// @dev defined by `root`. For this, a `proof` must be provided, containing
    /// @dev sibling hashes on the branch from the leaf to the root of the tree.
    function verifyMerkleProof(
        bytes32 merkleRoot,
        uint256 triadIndex,
        uint256 triadNodeIndex,
        bytes32 leaf,
        bytes32[TREE_DEPTH + 1] calldata pathElements
    ) internal pure {
        // [0] - Assumed it is computed by the TriadIncrementalMerkleTrees
        //       using modulo operation, so no need to check lower range
        //require(iTRIAD_INDEX_LEFT <= triadIndex, ERR_TRIAD_INDEX_MIN_VALUE);
        require(triadIndex < iTRIAD_INDEX_FORBIDDEN, ERR_TRIAD_INDEX_MAX_VALUE);

        // [1] - Compute zero level hash
        // variable will be initialized inside the 'if' bellow
        // slither-disable-next-line uninitialized-local
        bytes32 nodeHash;
        // NOTE: no else-case needed since this code executed after require at step [0]
        if (triadIndex == iTRIAD_INDEX_LEFT) {
            nodeHash = PoseidonT4.poseidon(
                [leaf, pathElements[0], pathElements[1]]
            );
        } else if (triadIndex == iTRIAD_INDEX_MIDDLE) {
            nodeHash = PoseidonT4.poseidon(
                [pathElements[0], leaf, pathElements[1]]
            );
        } else if (triadIndex == iTRIAD_INDEX_RIGHT) {
            nodeHash = PoseidonT4.poseidon(
                [pathElements[0], pathElements[1], leaf]
            );
        }

        // [2] - Compute root
        for (uint256 level = 2; level < pathElements.length; level++) {
            bool isLeftNode;
            unchecked {
                // triadNodeIndex is actually a path to triad-node in merkle-tree
                // each LSB bit of this number is left or right path
                // it means for example: path = b111 , zero leaf will be from right size of hash
                // and path element[2] will be from right side of hash, all other path elements [3,4] will be from
                // left side of the next hashes till root.
                isLeftNode = ((triadNodeIndex & (0x1 << (level - 2))) == 0);
            }
            if (isLeftNode) {
                // computed node from left side
                // Hash(left = nodeHash, right = pathElement)
                nodeHash = PoseidonT3.poseidon([nodeHash, pathElements[level]]);
            } else {
                // computed node from right side
                // Hash(left = pathElement, right = nodeHash)
                nodeHash = PoseidonT3.poseidon([pathElements[level], nodeHash]);
            }
        }
        // [3] - revert if verification fails
        require(merkleRoot == nodeHash, ERR_MERKLE_PROOF_VERIFICATION_FAILED);
    }
}
