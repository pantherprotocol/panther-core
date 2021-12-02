import {TriadMerkleTree, poseidon2or3} from '.';

import CONSTANTS from './constants';
import LZString from 'lz-string';
import _ from 'lodash';
import assert from 'assert';
import {ethers} from 'ethers';

// returns a new triad merkle tree constructed of passed 1536! commitments
const createTriadMerkleTree = (
    depth: number,
    commitments: string[],
    zeroValue: bigint,
): TriadMerkleTree => {
    assert(
        commitments.length <= 2 ** (depth - 1) * 3,
        `Commitments length must be equal or less than ${2 ** (depth - 1) * 3}`,
    );

    const triadMerkleTree = new TriadMerkleTree(depth, zeroValue, poseidon2or3);
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

const toBytes32 = (n: number | string): string => {
    return (
        '0x' +
        ethers.utils
            .hexlify(ethers.BigNumber.from(n))
            .replace('0x', '')
            .padStart(64, '0')
    );
};

export default {
    createTriadMerkleTree,
    compressString,
    decompressString,
    toBytes32,
};
