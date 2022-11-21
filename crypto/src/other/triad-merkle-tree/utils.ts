import assert from 'assert';
import fs from 'fs';

import {ethers} from 'ethers';
import _ from 'lodash';
import LZString from 'lz-string';

import {NewCommitmentEvent} from '../../types/commitments';

import {
    MerkleProof,
    TriadMerkleTree,
    poseidon2or3,
    LEAF_NODE_SIZE,
    TREE_DEPTH,
} from '.';

// returns a new triad merkle tree constructed of passed 1536! commitments
export function createTriadMerkleTree(
    depth: number,
    commitments: string[],
    zeroValue: bigint,
): TriadMerkleTree {
    assert(
        commitments.length <= 2 ** (depth - 1) * 3,
        `Commitments length must be equal or less than ${2 ** (depth - 1) * 3}`,
    );

    const triadMerkleTree = new TriadMerkleTree(depth, zeroValue, poseidon2or3);
    _.chunk(commitments, LEAF_NODE_SIZE).forEach((leaves: string[]) => {
        triadMerkleTree.insertBatch(leaves.map(c => BigInt(c)));
    });
    return triadMerkleTree;
}

// compress string before storing it
export function compressString(s: string): string {
    return LZString.compressToUTF16(s);
}

export function decompressString(s: string): string | null {
    return LZString.decompressFromUTF16(s);
}

export function toBytes32(n: number | string | bigint) {
    return ethers.utils.hexZeroPad(
        ethers.utils.hexlify(ethers.BigNumber.from(n)),
        32,
    );
}

// quadLeafIdToTreeIdAndTriadLeafId converts the Quad Leaf ID to Tree ID and
// Triad Leaf ID
export function quadLeafIdToTreeIdAndTriadLeafId(
    leafId: BigInt,
    treeDepth = TREE_DEPTH,
): [number, number] {
    const nLeafId = Number(leafId);
    const maxQuadLeafId = quadLeafCountPerTree(treeDepth);
    const treeId = Math.floor(nLeafId / maxQuadLeafId);
    const triadIndex =
        (nLeafId % maxQuadLeafId) - Math.floor((nLeafId % maxQuadLeafId) / 4);
    return [treeId, triadIndex];
}

// quadLeafCountPerTree returns the quad leaf count per merkle tree with the
// given depth
export function quadLeafCountPerTree(treeDepth = TREE_DEPTH): number {
    return 2 ** (treeDepth + 1);
}

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

// quadLeafIndexRangeForTreeId returns the range of the quad leaf indices for
// the specific treeId
export function quadLeafIndexRangeForTreeId(
    treeId: number,
    treeDepth = TREE_DEPTH,
): [number, number] {
    const maxLeafCount = quadLeafCountPerTree(treeDepth);
    const minLeafIndex = maxLeafCount * treeId;
    const maxLeafIndex = maxLeafCount * (treeId + 1) - 1;
    return [minLeafIndex, maxLeafIndex];
}

export function triadTreeMerkleProofToPathElements({
    pathElements: input,
}: MerkleProof): bigint[] {
    // Output for every level must be a single element.
    // Leaf level input is an array of two elements,
    // it must be converted in two output elements.
    return input.flat(1);
}

// reads commitments from the JSON file with NewCommitmentLog[]
export function readCommitmentsFromCommitmentLog(fn: string): string[] {
    console.log(`reading file ${fn}...`);
    const events: NewCommitmentEvent[] = JSON.parse(
        fs.readFileSync(fn, 'utf-8'),
    );

    console.log(`found ${events.length} events`);

    const commitments = events
        .sort((a: NewCommitmentEvent, b: NewCommitmentEvent) =>
            BigInt(a.leftLeafId) > BigInt(b.leftLeafId) ? 1 : -1,
        )
        .map((c: NewCommitmentEvent) => c.commitments)
        .flat();

    console.log(`which have ${commitments.length} commitments`);
    return commitments;
}
