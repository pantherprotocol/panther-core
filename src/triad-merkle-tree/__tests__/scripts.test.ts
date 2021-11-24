import {describe, expect} from '@jest/globals';

import CONSTANTS from '../constants';
import {TriadMerkleTree} from '..';
import Utils from '../utils';
import _ from 'lodash';
import {exec} from 'child_process';

const CONTRACT_ADDRESS = '0x47576518f3Fbd15aFc4abbE35e699DdA477B9E17';
const RPC_ADDRESS = 'http://127.0.0.1:8545';
const PATH = 'src/triad-merkle-tree/__tests__/data';

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
};

// This test require that you have testrpc running with deployed MockNewIdentityEmitter contract
describe('CLI Triad Merkle Tree generation', () => {
    const scriptTrees: TriadMerkleTree[] = [];
    const trees: TriadMerkleTree[] = [];

    beforeAll(() => {
        exec(
            `ts-node ./src/triad-merkle-tree/scripts/tmt.ts generate -c ` +
                `${CONTRACT_ADDRESS} -n ${RPC_ADDRESS}` +
                ` -p ${PATH}`,
        );

        const commitments = Array.from(
            {length: CONSTANTS.TREE_SIZE * 2},
            (_, i) => Utils.toBytes32(i + 1),
        );
        _.chunk(commitments, CONSTANTS.TREE_SIZE).forEach((chunk, index) => {
            scriptTrees.push(
                TriadMerkleTree.load(
                    PATH + `/identities-tree-${index}.json`,
                    false,
                ),
            );
            trees.push(Utils.createTriadMerkleTree(10, chunk, BigInt(100)));
        });
    });

    it.skip('should have correct roots', () => {
        scriptTrees.forEach((scriptTree, index) => {
            expect(scriptTree.root).toEqual(trees[index].root);
        });
    });

    it.skip('should have correct proofs', () => {
        scriptTrees.forEach((scriptTree, treeIdx) => {
            scriptTree.leaves.forEach((_, leafIdx) => {
                const firstProof = scriptTree.genMerklePath(leafIdx);
                const secondProof = trees[treeIdx].genMerklePath(leafIdx);

                expect(
                    firstProof.leaf === secondProof.leaf &&
                        firstProof.depth === secondProof.depth &&
                        firstProof.root === secondProof.root &&
                        firstProof.pathElements.every((a, idx) =>
                            _arraysAreEqual(a, secondProof.pathElements[idx]),
                        ) &&
                        _arraysAreEqual(
                            firstProof.indices,
                            secondProof.indices,
                        ),
                ).toBeTruthy();
            });
        });
    });
});
