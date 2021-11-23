/* ========================================================================== */
/*                               TriadMerkleTree                              */
/* ========================================================================== */

/*
A Triad Merkle tree is a binary Merkle tree in which the outer nodes have
3 leaves and inner nodes have 2 leaves.

This code is modified version of incrementalquintree:
https://github.com/appliedzkp/incrementalquintree
*/

import Utils from './utils';
import assert from 'assert';
import fs from 'fs';
// @ts-ignore
import { poseidon } from 'circomlibjs';

type PathElements = bigint[][];
type Indices = number[];

interface MerkleProof {
    pathElements: PathElements;
    indices: Indices;
    depth: number;
    root: bigint;
    leaf: bigint;
}

const calcInitialVals = (
    internalNodeSize: number,
    depth: number,
    zeroValue: bigint,
    hashFunc: (leaves: bigint[]) => bigint,
) => {
    const zeros: bigint[] = [zeroValue];
    const filledSubtrees: bigint[][] = [[zeroValue, zeroValue, zeroValue]];
    const filledPaths: any = { 0: [] };

    let currentLevelHash = hashFunc(filledSubtrees[0]);
    for (let i = 1; i < depth; i++) {
        if (i < depth - 1) {
            filledPaths[i] = [];
        }
        zeros.push(currentLevelHash);

        const z: bigint[] = [];
        for (let j = 0; j < internalNodeSize; j++) {
            z.push(zeros[i]);
        }
        filledSubtrees.push(z);

        currentLevelHash = hashFunc(z);
    }

    const root = hashFunc(filledSubtrees[depth - 1]);

    return { zeros, filledSubtrees, filledPaths, root };
};

const hash23 = (inputs: bigint[]): bigint => {
    assert(inputs.length === 3 || inputs.length === 2);
    return poseidon(inputs);
};

const _convertBnToHex = (bn: bigint): string => {
    return '0x' + bn.toString(16);
};

const _insertBatch = (
    depth: number,
    internalNodeSize: number,
    nextIndex: number,
    newLeaves: bigint[],
    filledSubtrees: bigint[][],
    filledPaths: any,
    leaves: bigint[],
    zeros: bigint[],
    hashFunc: (leaves: bigint[]) => bigint,
) => {
    filledSubtrees[0] = newLeaves;

    let currentIndex = nextIndex;
    for (let i = 1; i < depth; i++) {
        // m is the leaf's relative position within its node
        const m = currentIndex % internalNodeSize;

        if (m === 0) {
            // Zero out the level
            for (let j = 1; j < filledSubtrees[i].length; j++) {
                filledSubtrees[i][j] = zeros[i];
            }
        }

        const z = filledSubtrees[i - 1];
        const hashed = hashFunc(z);
        filledSubtrees[i][m] = hashed;

        if (filledPaths[i - 1].length <= currentIndex) {
            filledPaths[i - 1].push(hashed);
        } else {
            filledPaths[i - 1][currentIndex] = hashed;
        }

        // currentIndex is the leaf or node's absolute index
        currentIndex = Math.floor(currentIndex / internalNodeSize);
    }

    for (let i = 0; i < newLeaves.length; i++) {
        leaves.push(newLeaves[i]);
    }
};

const _genMerklePath = (
    _index: number,
    internalNodeSize: number,
    leafNodeSize: number,
    depth: number,
    leaves: bigint[],
    zeros: bigint[],
    filledPaths: any,
    root: bigint,
): MerkleProof => {
    if (_index < 0) {
        throw new Error('The leaf index must be greater than 0');
    }
    if (_index >= leaves.length) {
        throw new Error('The leaf index is too large');
    }

    const indices: number[] = [_index % leafNodeSize];
    const pathElements: bigint[][] = [[]];

    const leafStartIndex = _index - (_index % leafNodeSize);
    const leafEndIndex = leafStartIndex + leafNodeSize;

    // Generation of the first level with triad
    for (let j = leafStartIndex; j < leafEndIndex; j++) {
        if (j < leaves.length) {
            pathElements[0].push(leaves[j]);
        } else {
            pathElements[0].push(zeros[0]);
        }
    }

    // the rest of the tree
    let r = Math.floor(_index / leafNodeSize);
    for (let i = 0; i < depth; i++) {
        const s: bigint[] = [];
        if (i === 0) {
            // Get a slice of leaves, padded with zeros
            const leafStartIndex = _index - (_index % internalNodeSize);
            const leafEndIndex = leafStartIndex + internalNodeSize;
            for (let j = leafStartIndex; j < leafEndIndex; j++) {
                if (j < leaves.length) {
                    s.push(leaves[j]);
                } else {
                    s.push(zeros[i]);
                }
            }
        } else {
            for (let j = 0; j < internalNodeSize; j++) {
                const x = r * internalNodeSize + j;
                if (filledPaths[i - 1].length <= x) {
                    s.push(zeros[i]);
                } else {
                    const e = filledPaths[i - 1][x];
                    s.push(e);
                }
            }
        }

        if (i > 0) {
            pathElements.push(s);
        }

        const p = r % internalNodeSize;
        if (i < depth - 1) {
            indices.push(p);
        }

        r = Math.floor(r / internalNodeSize);
    }

    // Remove the commitments to elements which are the leaves per level
    const newPe: bigint[][] = [[]];
    const firstIndex = _index % leafNodeSize;

    for (let i = 0; i < pathElements[0].length; i++) {
        if (i !== firstIndex) {
            newPe[0].push(pathElements[0][i]);
        }
    }

    for (let i = 1; i < pathElements.length; i++) {
        const level: bigint[] = [];
        for (let j = 0; j < pathElements[i].length; j++) {
            if (j !== indices[i]) {
                level.push(pathElements[i][j]);
            }
        }
        newPe.push(level);
    }

    return {
        pathElements: newPe,
        indices,
        depth: depth,
        root,
        leaf: leaves[_index],
    };
};

const _verifyMerklePath = (
    _proof: MerkleProof,
    _hashFunc: (leaves: bigint[]) => bigint,
) => {
    assert(_proof.pathElements);

    const pathElements = _proof.pathElements;
    // Validate the proof format
    assert(_proof.indices);
    for (let i = 0; i < _proof.depth; i++) {
        assert(pathElements[i]);
        assert(_proof.indices[i] != undefined);
    }

    // Hash the first level
    const firstLevel: bigint[] = pathElements[0];
    firstLevel.splice(Number(_proof.indices[0]), 0, _proof.leaf);
    let currentLevelHash: bigint = _hashFunc(firstLevel);

    // Verify the proof
    for (let i = 1; i < pathElements.length; i++) {
        const level: bigint[] = pathElements[i];
        level.splice(Number(_proof.indices[i]), 0, currentLevelHash);

        currentLevelHash = _hashFunc(level);
    }

    return currentLevelHash === _proof.root;
};

/*
 * An Triad Merkle tree is binary Merkle tree with 3 leaves at the outer node.
 */
class TriadMerkleTree {
    // this is the size of the internal node of the tree at depth != 0
    public internalNodeSize: number;

    // this is the number of leaves per node at depth 0,
    // that does not have child nodes
    public leafNodeSize: number;

    // The tree depth
    public depth: number;

    // The default value for empty leaves
    public zeroValue: bigint;

    // The tree root
    public root: bigint;

    // The the smallest empty leaf index
    public nextIndex: number;

    // All leaves in the tree
    public leaves: bigint[] = [];

    // Contains the zero value per level. i.e. zeros[0] is zeroValue,
    // zeros[1] is the hash of internalNodeSize zeros, and so on.
    // zeros is the most left branch of hashes of the tree
    public zeros: bigint[] = [];

    // Caches values needed for efficient appends.
    // The cache is a list of neighbor nodes hashes
    // Filled subtrees is the path of the last insert "walk"
    public filledSubtrees: bigint[][] = [];

    // Caches values needed to compute Merkle paths.
    // it is hashes at different depths
    public filledPaths: any = {};

    // The hash function to use
    private hashFunc: (leaves: bigint[]) => bigint;

    constructor(
        _depth: number,
        _zeroValue: bigint,
        _hashFunc: (leaves: bigint[]) => bigint,
    ) {
        this.internalNodeSize = Number(BigInt(2));
        this.leafNodeSize = Number(BigInt(3));
        this.depth = Number(_depth);

        assert(this.depth > 0);

        this.nextIndex = 0;
        this.zeroValue = _zeroValue;

        this.hashFunc = _hashFunc;

        const r = calcInitialVals(
            this.internalNodeSize,
            this.depth,
            this.zeroValue,
            this.hashFunc,
        );

        this.filledSubtrees = r.filledSubtrees;
        this.filledPaths = r.filledPaths;
        this.zeros = r.zeros;
        this.root = r.root;
    }

    /*
     * Insert 3 leaves at a time into the Merkle tree
     * @param _value The value to insert. This may or may not already be
     *               hashed.
     */
    public insertBatch(_leaves: bigint[]) {
        // A node is one level above the leaf
        // m is the leaf's relative position within its node
        assert(
            _leaves.length === this.leafNodeSize,
            `Commitments must be of length ${this.leafNodeSize}`,
        );

        const m = this.nextIndex % this.internalNodeSize;

        if (m === 0) {
            // Zero out the level in filledSubtrees
            for (let j = 1; j < this.filledSubtrees[0].length; j++) {
                this.filledSubtrees[0][j] = this.zeros[0];
            }
        }

        _insertBatch(
            this.depth,
            this.internalNodeSize,
            this.nextIndex,
            _leaves,
            this.filledSubtrees,
            this.filledPaths,
            this.leaves,
            this.zeros,
            this.hashFunc,
        );

        this.nextIndex++;
        this.root = this.hash(
            this.filledSubtrees[this.filledSubtrees.length - 1],
        );
    }

    /*
     *  Generates a Merkle proof from a leaf to the root.
     */
    public genMerklePath(_index: number): MerkleProof {
        return _genMerklePath(
            _index,
            this.internalNodeSize,
            this.leafNodeSize,
            this.depth,
            this.leaves,
            this.zeros,
            this.filledPaths,
            this.root,
        );
    }

    /*
     * Return true if the given Merkle path is valid, and false otherwise.
     */
    public static verifyMerklePath(
        _proof: MerkleProof,
        _hashFunc: (leaves: bigint[]) => bigint,
    ): boolean {
        return _verifyMerklePath(_proof, _hashFunc);
    }

    public hash(_leaves: bigint[]): bigint {
        if (this.internalNodeSize > 2) {
            while (_leaves.length < 5) {
                _leaves.push(this.zeroValue);
            }
        }
        return this.hashFunc(_leaves);
    }

    /*
     * Serializes the tree into a string
     */
    private _serialize(): string {
        const filledPaths: any = {};
        Object.keys(this.filledPaths).forEach((key: any) => {
            filledPaths[key] = this.filledPaths[key].map(_convertBnToHex);
        });

        return JSON.stringify({
            depth: this.depth,
            filledPaths: filledPaths,
            filledSubtrees: this.filledSubtrees.map(v =>
                v.map(_convertBnToHex),
            ),
            leafNodeSize: this.leafNodeSize,
            leaves: this.leaves.map(_convertBnToHex),
            nextIndex: this.nextIndex,
            root: _convertBnToHex(this.root),
            zeroValue: _convertBnToHex(this.zeroValue),
            zeros: this.zeros.map(_convertBnToHex),
        });
    }

    /*
     * Deserializes the string into the tree
     */
    private static _deserialize(_json: string): TriadMerkleTree {
        const t = Object.assign(
            new TriadMerkleTree(1, BigInt(0), hash23),
            JSON.parse(_json),
        );

        t.leaves = t.leaves.map(BigInt);
        t.zeros = t.zeros.map(BigInt);
        t.filledSubtrees = t.filledSubtrees.map((v: string[]) => v.map(BigInt));
        t.root = BigInt(t.root);
        t.zeroValue = BigInt(t.zeroValue);

        const filledPaths: any = {};
        Object.keys(t.filledPaths).forEach((key: any) => {
            filledPaths[key] = t.filledPaths[key].map(BigInt);
        });
        t.filledPaths = filledPaths;

        return t;
    }

    public static load(path: string, compression: boolean): TriadMerkleTree {
        const s = fs.readFileSync(path, 'ucs2');
        const treeString = compression ? Utils.decompressString(s) : s;
        if (treeString === null) {
            throw new Error('Could not decompress tree string');
        }
        return TriadMerkleTree._deserialize(treeString);
    }

    public save(path: string, compression: boolean): void {
        const s = compression ? Utils.compressString(this._serialize()) : this._serialize();
        fs.writeFileSync(path, s, 'ucs2');
    }
}

export { hash23, TriadMerkleTree, MerkleProof };
