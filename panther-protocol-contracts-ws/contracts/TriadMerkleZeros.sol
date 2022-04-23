// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
// solhint-disable var-name-mixedcase
pragma solidity ^0.8.4;

// Content is autogenerated by `lib/generateTriadMerkleZerosContract.ts`

/**
 * @dev The "triad binary tree" is a modified Merkle (full) binary tree with:
 * - every node, from the root upto the level preceding leaves, excluding
 * that level, has 2 child nodes (i.e. this subtree is a full binary tree);
 * - every node of the layer preceding leaves has 3 child nodes (3 leaves).
 * Example:
 * [4]                                       0
 *                                           |
 * [3]                        0--------------------------------1
 *                            |                                |
 * [2]                0---------------1                 2--------------3
 *                    |               |                 |              |
 * [1]            0-------1       2-------3        4-------5       6-------7
 *               /|\     /|\     /|\     /|\      /|\     /|\     /|\     /|\
 * [0] index:   0..2    3..5    6..8    9...11  12..14  15..17  18..20  21..24
 *
 *   leaf ID:   0..2    4..6    8..10   12..14  16..18  20..23  24..27  28..30
 *
 * - Number in [] is the "level index" that starts from 0 for the leaves level.
 * - Numbers in node/leaf positions are "node/leaf indices" which starts from 0
 *   for the leftmost node/leaf of every level.
 * - Numbers bellow leaves are IDs of leaves.
 *
 * Arithmetic operations with multiples of 2 (i.e. shifting) is "cheaper" than
 * operations with multiples of 3 (both on-chain and in zk-circuits).
 * Therefore, IDs of leaves (but NOT hashes of nodes) are calculated as if the
 * tree would have 4 (not 3) leaves in branches, with every 4th leaf skipped.
 * In other words, there are no leaves with IDs 3, 7, 11, 15, 19...
 */

// @notice The "triad binary tree" populated with zero leaf values
abstract contract TriadMerkleZeros {
    // @dev Order of alt_bn128 and the field prime of Baby Jubjub and Poseidon hash
    uint256 public constant FIELD_SIZE =
        21888242871839275222246405745257275088548364400416034343698204186575808495617;

    // Number of levels in a tree including both leaf and root levels
    uint256 internal constant TREE_LEVELS = 16;

    // @dev Number of levels in a tree excluding the root level
    // (also defined in scripts/writeTriadMerkleZeroesContracts.sh)
    uint256 public constant TREE_DEPTH = 15;

    // Number of leaves in a branch with the root on the level 1
    uint256 internal constant TRIAD_SIZE = 3;

    // Number of leaves in the fully populated tree
    uint256 internal constant LEAVES_NUM = (2**(TREE_DEPTH - 1)) * TRIAD_SIZE;

    // @dev Leaf zero value (`keccak256("Pantherprotocol")%SNARK_SCALAR_FIELD`)
    bytes32 public constant ZERO_VALUE =
        bytes32(
            uint256(
                0x667764c376602b72ef22218e1673c2cc8546201f9a77807570b3e5de137680d
            )
        );
    // Merkle root of a tree that contains zeros only
    bytes32 internal constant ZERO_ROOT =
        bytes32(
            uint256(
                0x20fc043586a9fcb416cdf2a3bc8a995f8f815d43f1046a20d1c588cf20482a55
            )
        );

    function populateZeros(bytes32[TREE_DEPTH] memory zeros) internal pure {
        zeros[0] = bytes32(
            uint256(
                0x667764c376602b72ef22218e1673c2cc8546201f9a77807570b3e5de137680d
            )
        );
        zeros[1] = bytes32(
            uint256(
                0x1be18cd72ac1586de27dd60eba90654bd54383004991951bccb0f6bad02c67f6
            )
        );
        zeros[2] = bytes32(
            uint256(
                0x7677e6102f0acf343edde864f79ef7652faa5a66d575b8b60bb826a4aa517e6
            )
        );
        zeros[3] = bytes32(
            uint256(
                0x28a85866ab97bd65cc94b0d1f5c5986481f8a0d65bdd5c1e562659eebb13cf63
            )
        );
        zeros[4] = bytes32(
            uint256(
                0x87321a66ea3af7780128ea1995d7fc6ec44a96a1b2d85d3021208cede68c15c
            )
        );
        zeros[5] = bytes32(
            uint256(
                0x233b4e488f0aaf5faef4fc8ea4fefeadb6934eb882bc33b9df782fd1d83b41a0
            )
        );
        zeros[6] = bytes32(
            uint256(
                0x1a0cefcf0c592da6426717d3718408c61af1d0a9492887f3faecefcba1a0a309
            )
        );
        zeros[7] = bytes32(
            uint256(
                0x2cdf963150b321923dd07b2b52659aceb529516a537dfebe24106881dd974293
            )
        );
        zeros[8] = bytes32(
            uint256(
                0x93a186bf9ec2cc874ceab26409d581579e1a431ecb6987d428777ceedfa15c4
            )
        );
        zeros[9] = bytes32(
            uint256(
                0xcbfc07131ef4197a4b4e60153d43381520ec9ab4c9c3ed34d88883a881a4e07
            )
        );
        zeros[10] = bytes32(
            uint256(
                0x17b31de43ba4c687cf950ad00dfbe33df40047e79245b50bd1d9f87e622bf2af
            )
        );
        zeros[11] = bytes32(
            uint256(
                0x2f3328354bceaf5882a8cc88053e0dd0ae594009a4e84e9e75a4fefe8604a602
            )
        );
        zeros[12] = bytes32(
            uint256(
                0x2b2e8defd4dad2404c6874918925fc1192123f45df0ee3e04b6c16ff22ca1cfd
            )
        );
        zeros[13] = bytes32(
            uint256(
                0x1cbdc4065aa4137da01d64a090706267d65f425ea5e815673516d29d9aa14d38
            )
        );
        zeros[14] = bytes32(
            uint256(
                0x13ca69f9fde4ece39e395bb55dd41ed7dd9dfaa26671e26bd9fd6f4f635fc872
            )
        );
    }
}
