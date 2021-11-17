// @ts-ignore
import {firstTree, secondTree, thirdTree} from './data/trees.js';

import {TriadTree} from '../triad-tree';
import _ from 'lodash';
import assert from 'assert';
// @ts-ignore
import {poseidon} from 'circomlibjs';

const ZERO_VALUE = BigInt(0);
const LEAF_NODE_SIZE = 3;

// Hash 2 or 3 elements
const hash23 = (inputs: bigint[]): bigint => {
    assert(inputs.length === 3 || inputs.length === 2);
    return poseidon(inputs);
};

// Hash represented as a sum of 2 or 3 elements (for debugging purposes)
const sum23 = (inputs: bigint[]): bigint => {
    assert(inputs.length === 3 || inputs.length === 2);
    return inputs.reduce(
        (s: bigint, a: bigint) => BigInt(s) + BigInt(a),
        BigInt(0),
    );
};

describe('Testing Triad Tree with provided examples', () => {
    describe('first tree', () => {
        let tree: TriadTree;
        beforeAll(() => {
            tree = new TriadTree(5, ZERO_VALUE, hash23);
            _.chunk(firstTree[0], LEAF_NODE_SIZE).forEach(
                (leaves: bigint[]) => {
                    tree.insertBatch(leaves);
                },
            );
        });

        it('should have correct hashes', () => {
            for (let i = 1; i < firstTree.length - 1; i++) {
                for (let j = 0; j < firstTree[i].length; j++) {
                    assert(tree.filledPaths[i - 1][j] === firstTree[i][j]);
                }
            }
        });

        it('should have correct proof', () => {
            const path = tree.genMerklePath(
                Math.floor(Math.random() * (tree.leaves.length + 1)),
            );
            expect(TriadTree.verifyMerklePath(path, hash23)).toBeTruthy();
        });

        it('should fail if proof incorrect', () => {
            const path = tree.genMerklePath(
                Math.floor(Math.random() * (tree.leaves.length + 1)),
            );
            path.leaf = BigInt(1000000000000000);
            expect(TriadTree.verifyMerklePath(path, hash23)).toBeFalsy();
        });
    });

    describe('second tree', () => {
        let tree: TriadTree;
        beforeAll(() => {
            tree = new TriadTree(5, ZERO_VALUE, hash23);
            _.chunk(secondTree[0], LEAF_NODE_SIZE).forEach(
                (leaves: bigint[]) => {
                    tree.insertBatch(leaves);
                },
            );
        });

        it('should have correct hashes', () => {
            for (let i = 1; i < secondTree.length - 1; i++) {
                for (let j = 0; j < secondTree[i].length; j++) {
                    assert(tree.filledPaths[i - 1][j] === secondTree[i][j]);
                }
            }
        });

        it('should have correct proof', () => {
            const path = tree.genMerklePath(
                Math.floor(Math.random() * (tree.leaves.length + 1)),
            );
            expect(TriadTree.verifyMerklePath(path, hash23)).toBeTruthy();
        });

        it('should fail if proof incorrect', () => {
            const path = tree.genMerklePath(
                Math.floor(Math.random() * (tree.leaves.length + 1)),
            );
            path.leaf = BigInt(100000000000000000000000);
            expect(TriadTree.verifyMerklePath(path, hash23)).toBeFalsy();
        });
    });

    describe('tree with zero leaves only', () => {
        let tree: TriadTree;
        beforeAll(() => {
            tree = new TriadTree(10, BigInt(thirdTree.zeroValue), hash23);
        });

        it('should have correct root with flled values', () => {
            for (let index = 0; index < 512; index++) {
                tree.insertBatch([
                    BigInt(thirdTree.zeroValue),
                    BigInt(thirdTree.zeroValue),
                    BigInt(thirdTree.zeroValue),
                ]);
            }
            expect(
                '0x' + tree.root.toString(16) === thirdTree.root,
            ).toBeTruthy();
        });

        it('should have correct root with not flled values', () => {
            expect(
                '0x' + tree.root.toString(16) === thirdTree.root,
            ).toBeTruthy();
        });
    });

    describe('Merkle proofs benchmarks', () => {
        let tree: TriadTree;
        beforeAll(() => {
            tree = new TriadTree(10, BigInt(thirdTree.zeroValue), hash23);
            for (let index = 0; index < 512; index++) {
                tree.insertBatch([
                    BigInt(thirdTree.zeroValue),
                    BigInt(thirdTree.zeroValue),
                    BigInt(thirdTree.zeroValue),
                ]);
            }
        });
        it('should have correct proof', () => {
            const path = tree.genMerklePath(
                Math.floor(Math.random() * (tree.leaves.length + 1)),
            );
            expect(TriadTree.verifyMerklePath(path, hash23)).toBeTruthy();
        });
    });

    describe('general tests', () => {
        it('should have size 2**(depth-1)*3 ', () => {
            const depth = 4;
            const tree = new TriadTree(depth, BigInt(1), sum23);
            assert(tree.root === BigInt(2 ** (depth - 1) * 3));

            for (let index = 0; index < 2 ** 3; index++) {
                tree.insertBatch([BigInt(1), BigInt(1), BigInt(1)]);
            }
            assert(tree.root === BigInt(2 ** (depth - 1) * 3));
        });
    });
});
