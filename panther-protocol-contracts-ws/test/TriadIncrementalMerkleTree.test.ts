// SPDX-License-Identifier: MIT
import { expect } from 'chai';
// TODO: make code code compile w/o ts-ignore
// @ts-ignore
import { ethers } from 'hardhat';
import {
    toBigNum,
    toBytes32,
    zeroLeaf,
    zeroTriadTreeRoot,
} from '../lib/utilities';

const BuildPoseidon = require('../scripts/buildPoseidon');
const getZeroLeavesTriad = () => [zeroLeaf, zeroLeaf, zeroLeaf];

describe('IncrementalMerkleTree', () => {
    // @ts-ignore
    let trees: ethers.Contract;
    let TriadIncrementalMerkleTrees;

    before(async () => {
        const PoseidonT3 = await BuildPoseidon.getPoseidonT3Contract();
        const poseidonT3 = await PoseidonT3.deploy();
        await poseidonT3.deployed();

        const PoseidonT4 = await BuildPoseidon.getPoseidonT4Contract();
        const poseidonT4 = await PoseidonT4.deploy();
        await poseidonT4.deployed();

        // Link Poseidon contracts
        // @ts-ignore
        TriadIncrementalMerkleTrees = await ethers.getContractFactory(
            'MockTriadIncrementalMerkleTrees',
            {
                libraries: {
                    PoseidonT3: poseidonT3.address,
                    PoseidonT4: poseidonT4.address,
                },
            },
        );
    });

    describe('an empty tree', function () {
        before(async () => {
            trees = await TriadIncrementalMerkleTrees.deploy();
            await trees.deployed();
        });

        it('should have the depth of 15', async () => {
            expect(await trees.TREE_DEPTH()).to.equal(15);
        });

        it('should have the correct zero leaf value', async () => {
            expect(await trees.ZERO_VALUE()).to.equal(toBigNum(zeroLeaf));
        });

        it('should have the current tree ID of zero', async () => {
            expect(await trees.curTree()).to.equal(0);
        });

        it('should have 0 leaves counted', async () => {
            expect(await trees.leavesNum()).to.equal(0);
        });

        it('should return 0 as the current root', async () => {
            expect(await trees.curRoot()).to.equal(toBytes32(0));
        });

        it('should not "know" the empty tree root', async () => {
            expect(await trees.isKnownRoot(zeroTriadTreeRoot)).to.equal(false);
        });
    });

    describe('internal `insertBatch` method', function () {
        describe('a call inserting 3 zero leaves', () => {
            let promises;

            beforeEach(async () => {
                trees = await TriadIncrementalMerkleTrees.deploy();
                await trees.deployed();
                promises = trees.internalInsertBatch(getZeroLeavesTriad());
                await promises;
            });

            it('should insert 3 leaves at once', async () => {
                expect(await trees.leavesNum()).to.equal(3);
            });

            it('should emit the `CachedRoot` event', async () => {
                await expect(promises)
                    .to.emit(trees, 'CachedRoot')
                    .withArgs(zeroTriadTreeRoot);
            });

            it('should set the empty tree root as the current root', async () => {
                expect(await trees.curRoot()).to.equal(
                    toBigNum(zeroTriadTreeRoot),
                );
            });

            it('should "get known" the empty tree root', async () => {
                expect(await trees.isKnownRoot(zeroTriadTreeRoot)).to.equal(
                    true,
                );
            });
        });

        describe('when called 3 times with zero leaves', () => {
            before(async () => {
                trees = await TriadIncrementalMerkleTrees.deploy();
                await trees.deployed();
            });

            it('the 1st call should return `leftLeafIds` of 0', async () => {
                await expect(trees.internalInsertBatch(getZeroLeavesTriad()))
                    .to.emit(trees, 'InternalInsertBatch')
                    .withArgs(0);
            });

            it('the 2nd call should return `leftLeafIds` of 4', async () => {
                await expect(trees.internalInsertBatch(getZeroLeavesTriad()))
                    .to.emit(trees, 'InternalInsertBatch')
                    .withArgs(4);
            });

            it('the 3rd call should return `leftLeafIds` of 8', async () => {
                await expect(trees.internalInsertBatch(getZeroLeavesTriad()))
                    .to.emit(trees, 'InternalInsertBatch')
                    .withArgs(8);
            });

            it('should insert 9 leaves', async () => {
                expect(await trees.leavesNum()).to.equal(9);
            });

            it('should set the empty tree root as the current root', async () => {
                expect(await trees.curRoot()).to.equal(
                    toBigNum(zeroTriadTreeRoot),
                );
            });
        });

        describe('when called 8 times with non-zero leaves', () => {
            let shift = 0;
            const getNewTriad = () => [
                toBytes32(shift++),
                toBytes32(shift++),
                toBytes32(shift++),
            ];

            before(async () => {
                trees = await TriadIncrementalMerkleTrees.deploy();
                await trees.deployed();
            });

            it('the 3rd call should set the `leftLeafIds` of 8', async () => {
                await trees.internalInsertBatch(getNewTriad());
                await trees.internalInsertBatch(getNewTriad());
                await expect(trees.internalInsertBatch(getNewTriad()))
                    .to.emit(trees, 'InternalInsertBatch')
                    .withArgs(8);
            });

            it('the 8th call should set the `leftLeafIds` of 28', async () => {
                await trees.internalInsertBatch(getNewTriad());
                await trees.internalInsertBatch(getNewTriad());
                await trees.internalInsertBatch(getNewTriad());
                await trees.internalInsertBatch(getNewTriad());
                await expect(trees.internalInsertBatch(getNewTriad()))
                    .to.emit(trees, 'InternalInsertBatch')
                    .withArgs(28);
            });

            it('should insert 24 leaves', async () => {
                expect(await trees.leavesNum()).to.equal(24);
            });

            it('should set non-empty tree root', async () => {
                expect(await trees.curRoot()).not.to.equal(
                    toBigNum(zeroTriadTreeRoot),
                );
            });
        });

        describe('`isKnownRoot` method', () => {
            // leafNum to nextLeafId: n2nli = (n) => Math.floor(n/3)*4 + n%3
            // nextLeafId to leafNum: nli2n = (i) => Math.floor(i/4)*3 + i%4
            xit('FIXME: should be tested');
        });
    });
});
