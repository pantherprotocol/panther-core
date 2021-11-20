import {TriadMerkleTree, hash23} from '../triad-merkle-tree';

import LZString from 'lz-string';
import _ from 'lodash';
import assert from 'assert';

const LEAF_NODE_SIZE = 3;
const TREE_SIZE = 1536;

// returns a new triad merkle tree constructed of passed 1536! commitments
const createTriadMerkleTree = (commitments: string[]): TriadMerkleTree => {
    assert(
        commitments.length === TREE_SIZE,
        'Commitments must be of length 1536',
    );

    const triadMerkleTree = new TriadMerkleTree(10, BigInt(0), hash23);
    _.chunk(commitments, LEAF_NODE_SIZE).forEach((leaves: string[]) => {
        triadMerkleTree.insertBatch(leaves.map(c => BigInt(c)));
    });
    return triadMerkleTree;
};

// compress string before storing it
const compressString = (s: string): string => {
    return LZString.compressToUTF16(s);
};

const decompressString = (s: string): string | null => {
    return LZString.decompressFromUTF16(s);
};

// produces a string that can be stored on local drive
const stringifyTree = (tree: TriadMerkleTree, compression: boolean): string => {
    return compression ? compressString(tree.serialize()) : tree.serialize();
};

// loads triad merkle tree from string (compressed or not)
const loadTree = (s: string, compression: boolean): TriadMerkleTree => {
    const treeString = compression ? decompressString(s) : s;
    if (treeString === null) {
        throw new Error('Could not decompress tree string');
    }
    return TriadMerkleTree.deserialize(treeString);
};

export default {
    createTriadMerkleTree,
    stringifyTree,
    loadTree,
    compressString,
    decompressString,
};
