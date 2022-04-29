// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { PoseidonT3, PoseidonT4 } from "../../crypto/Poseidon.sol";
import { ERR_UNKNOWN_MERKLE_ROOT } from "../../common/ErrorMsgs.sol";

abstract contract MerkleProofVerifier {
    uint256 private constant TREE_DEPTH = 15;

    function verifyMerkleProof(
        bytes32 merkleRoot,
        uint256 cacheIndexHint,
        uint256 leafIndex,
        bytes32 leaf,
        bytes32[TREE_DEPTH + 1] calldata pathElements
    ) internal view {
        // revert if verification fails
        // TODO: implement
    }
}
