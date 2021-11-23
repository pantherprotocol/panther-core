import {TriadMerkleTree, hash23} from '.';

import CONSTANTS from './constants';
import LZString from 'lz-string';
import _ from 'lodash';
import assert from 'assert';

// returns a new triad merkle tree constructed of passed 1536! commitments
const createTriadMerkleTree = (
    depth: number,
    commitments: string[],
    zeroValue: bigint,
): TriadMerkleTree => {
    assert(
        commitments.length <= 2 ** (depth - 1) * 3,
        'Commitments length must be equal or less than 1536',
    );

    const triadMerkleTree = new TriadMerkleTree(depth, zeroValue, hash23);
    _.chunk(commitments, CONSTANTS.LEAF_NODE_SIZE).forEach(
        (leaves: string[]) => {
            triadMerkleTree.insertBatch(leaves.map(c => BigInt(c)));
        },
    );
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
