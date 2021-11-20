import { MerkleProof, TriadMerkleTree, hash23 } from '../../triad-merkle-tree';
// @ts-ignore
import { firstTree, secondTree, thirdTree } from './data/trees.js';

import _ from 'lodash';
import assert from 'assert';

const ZERO_VALUE = BigInt(0);
const LEAF_NODE_SIZE = 3;

// Hash represented as a sum of 2 or 3 elements (for debugging purposes)
const sum23 = (inputs: bigint[]): bigint => {
    assert(inputs.length === 3 || inputs.length === 2);
    return inputs.reduce(
        (s: bigint, a: bigint) => BigInt(s) + BigInt(a),
        BigInt(0),
    );
};

// helper function to compare two arrays
const _arraysAreEqual = (a: any[], b: any[]) => {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}

describe('Testing Triad Tree with provided examples', () => {
    describe('first tree', () => {
        let tree: TriadMerkleTree;
        beforeAll(() => {
            tree = new TriadMerkleTree(5, ZERO_VALUE, hash23);
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
                Math.floor(Math.random() * tree.leaves.length),
            );
            expect(TriadMerkleTree.verifyMerklePath(path, hash23)).toBeTruthy();
        });

        it('should fail if proof incorrect', () => {
            const path = tree.genMerklePath(
                Math.floor(Math.random() * (tree.leaves.length)),
            );
            path.leaf = BigInt(1000000000000000);
            expect(TriadMerkleTree.verifyMerklePath(path, hash23)).toBeFalsy();
        });
    });

    describe('second tree', () => {
        let tree: TriadMerkleTree;
        beforeAll(() => {
            tree = new TriadMerkleTree(5, ZERO_VALUE, hash23);
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
                Math.floor(Math.random() * tree.leaves.length),
            );
            expect(TriadMerkleTree.verifyMerklePath(path, hash23)).toBeTruthy();
        });

        it('should fail if proof incorrect', () => {
            const path = tree.genMerklePath(
                Math.floor(Math.random() * tree.leaves.length),
            );
            path.leaf = BigInt(100000000000000000000000);
            expect(TriadMerkleTree.verifyMerklePath(path, hash23)).toBeFalsy();
        });
    });

    describe('tree with zero leaves only', () => {
        let tree: TriadMerkleTree;
        beforeAll(() => {
            tree = new TriadMerkleTree(10, BigInt(thirdTree.zeroValue), hash23);
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
        let tree: TriadMerkleTree;
        beforeAll(() => {
            tree = new TriadMerkleTree(10, BigInt(thirdTree.zeroValue), hash23);
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
                Math.floor(Math.random() * tree.leaves.length),
            );
            expect(TriadMerkleTree.verifyMerklePath(path, hash23)).toBeTruthy();
        });
    });

    describe('general tests', () => {
        it('should have size 2**(depth-1)*3 ', () => {
            const depth = 4;
            const tree = new TriadMerkleTree(depth, BigInt(1), sum23);
            assert(tree.root === BigInt(2 ** (depth - 1) * 3));

            for (let index = 0; index < 2 ** 3; index++) {
                tree.insertBatch([BigInt(1), BigInt(1), BigInt(1)]);
            }
            expect(tree.root).toBe(BigInt(2 ** (depth - 1) * 3));
        });
    });

    describe('serialization of the tree to json and back', () => {
        let firstTree: TriadMerkleTree;
        let secondTree: TriadMerkleTree;
        let firstProof: MerkleProof;
        let secondProof: MerkleProof;
        let randomLeafIndex: number;

        beforeAll(() => {
            const depth = 4;
            firstTree = new TriadMerkleTree(depth, BigInt(1), hash23);
            for (let index = 0; index < 2 ** 3; index++) {
                firstTree.insertBatch([BigInt(1), BigInt(1), BigInt(1)]);
            }
            secondTree = TriadMerkleTree.deserialize(firstTree.serialize());

            randomLeafIndex = Math.floor(Math.random() * firstTree.leaves.length);
            firstProof = firstTree.genMerklePath(randomLeafIndex);
            secondProof = secondTree.genMerklePath(randomLeafIndex);
        })

        it('should be deep equal', () => {
            expect(
                secondTree.depth === firstTree.depth &&
                secondTree.root === firstTree.root &&
                secondTree.zeroValue === firstTree.zeroValue &&
                secondTree.leafNodeSize === firstTree.leafNodeSize &&
                secondTree.nextIndex === firstTree.nextIndex &&
                _arraysAreEqual(secondTree.zeros, firstTree.zeros) &&
                _arraysAreEqual(secondTree.leaves, firstTree.leaves) &&
                firstTree.filledSubtrees.every((a, index) => _arraysAreEqual(a, secondTree.filledSubtrees[index])) &&
                Object.keys(firstTree.filledPaths).every(key => _arraysAreEqual(firstTree.filledPaths[key], secondTree.filledPaths[key]))
            ).toBeTruthy();
        })

        it('should generate the same proof', () => {
            expect(
                firstProof.leaf === secondProof.leaf &&
                firstProof.depth === secondProof.depth &&
                firstProof.root === secondProof.root &&
                firstProof.pathElements.every((a, index) => _arraysAreEqual(a, secondProof.pathElements[index])) &&
                _arraysAreEqual(firstProof.indices, secondProof.indices)
            ).toBeTruthy();
        })

        it('should have correct proof', () => {
            expect(TriadMerkleTree.verifyMerklePath(firstProof, hash23)).toBeTruthy();
            expect(TriadMerkleTree.verifyMerklePath(secondProof, hash23)).toBeTruthy();
        })

        it('incorrect proof should be declined', () => {
            const firstIncorrectProof = firstTree.genMerklePath(randomLeafIndex);
            firstIncorrectProof.leaf = BigInt(100000000000000000000000);
            const secondIncorrectProof = secondTree.genMerklePath(randomLeafIndex);
            secondIncorrectProof.leaf = BigInt(100000000000000000000000);

            expect(TriadMerkleTree.verifyMerklePath(firstIncorrectProof, hash23)).toBeFalsy();
            expect(TriadMerkleTree.verifyMerklePath(secondIncorrectProof, hash23)).toBeFalsy();
        })
    });

});