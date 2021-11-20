import { TriadMerkleTree, hash23 } from "../triad-merkle-tree"

import _ from "lodash"
import assert from "assert"

const LEAF_NODE_SIZE = 3;
const TREE_SIZE = 1536

const createTriadMerkleTree = (commitments: string[]): TriadMerkleTree => {
    assert(commitments.length === TREE_SIZE, "Commitments must be of length 1536")

    const triadMerkleTree = new TriadMerkleTree(10, BigInt(0), hash23)
    _.chunk(commitments, LEAF_NODE_SIZE).forEach(
        (leaves: string[]) => {
            triadMerkleTree.insertBatch(leaves.map(c => BigInt(c)));
        },
    );
    return triadMerkleTree
};

export default { createTriadMerkleTree }