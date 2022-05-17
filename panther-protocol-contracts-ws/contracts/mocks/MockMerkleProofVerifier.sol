// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
pragma solidity ^0.8.4;

import "../triadTree/TriadIncrementalMerkleTrees.sol";
import "../pantherPool/v0/MerkleProofVerifier.sol";
import "../pantherPool/v0/PubKeyGenerator.sol";

contract MockMerkleProofVerifier is
    MerkleProofVerifier,
    TriadIncrementalMerkleTrees,
    PubKeyGenerator
{
    bool _verifiedProof;

    function testMerkleProof(
        uint256 leafId,
        bytes32 merkleRoot,
        bytes32 commitment,
        bytes32[TREE_DEPTH + 1] calldata pathElementss
    ) external {
        _verifiedProof = false;
        verifyMerkleProof(
            merkleRoot,
            getTriadIndex(leafId),
            getTriadNodeIndex(leafId),
            commitment,
            pathElementss
        );
        _verifiedProof = true;
    }

    function isProofVerified() external view returns (bool) {
        return _verifiedProof;
    }

    function GeneratePublicSpendingKey(uint256 privKey)
        external
        view
        returns (uint256[2] memory xy)
    {
        G1Point memory p;
        p = generatePubSpendingKey(privKey);
        xy[0] = p.x;
        xy[1] = p.y;
    }

    bytes32[TREE_DEPTH] pathElements;

    uint256 leftLeafId;

    // DONT remove - it can be used
    function internalInsertBatchZkp(bytes32[TRIAD_SIZE] memory leaves)
        external
    {
        (leftLeafId, pathElements) = insertBatchZkp(leaves);
    }

    function LeafId() external view returns (uint256) {
        return leftLeafId;
    }

    function PathElements() external view returns (bytes32[TREE_DEPTH] memory) {
        return pathElements;
    }
}
