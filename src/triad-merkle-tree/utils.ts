import {MerkleProof, TriadMerkleTree, poseidon2or3} from '.';

import CONSTANTS from './constants';
import LZString from 'lz-string';
import _ from 'lodash';
import assert from 'assert';
import {ethers} from 'ethers';

// returns a new triad merkle tree constructed of passed 1536! commitments
export const createTriadMerkleTree = (
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
export const compressString = (s: string): string => {
    return LZString.compressToUTF16(s);
};

export const decompressString = (s: string): string | null => {
    return LZString.decompressFromUTF16(s);
};

export const toBytes32 = (n: number | string): string => {
    return (
        '0x' +
        ethers.utils
            .hexlify(ethers.BigNumber.from(n))
            .replace('0x', '')
            .padStart(64, '0')
    );
};

// converts the Quad Leaf ID to Tree ID and Triad Leaf ID
export const leafIdToTreeIdAndTriadId = (leafId: BigInt): [number, number] => {
    const nLeafId = Number(leafId);
    const treeId = Math.floor(nLeafId / 2048);
    const triadIndex = (nLeafId % 2048) - Math.floor((nLeafId % 2048) / 4);
    return [treeId, triadIndex];
};

export function triadTreeMerkleProofToPathIndices({
    indices: input,
}: MerkleProof): number[] {
    // every output index must be one-bit signal (0 or 1 in the lower bit)
    // leaf level index in the `input` has two bits, ...
    // ... and it must be converted in two output signals
    return [input[0] % 2, input[0] >> 1].concat(
        input.slice(1), // for inner levels, inputs do not need conversion
    );
}

export function triadTreeMerkleProofToPathElements({
    pathElements: input,
}: MerkleProof): bigint[] {
    // Output for every level must be a single element.
    // Leaf level input is an array of two elements,
    // it must be converted in two output elements.
    return input.flat(1);
}
