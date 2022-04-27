// TODO: test switching to a new tree
// Start from the empty tree, then ...
// 1) Check the `curTree()` - shall be 0
// 2) Simulate insertion of 16383 triads with `fakeNextLeafId(16383 * 4)`, save `curRoot()` result,
// check the cache index 1021 = (16383 * 4) % (256 *4) + 1.
// 3) Check `finalRoots(0)` is 0x00.
// 4) Insert the 16484th triad with `internalInsertBatch`.
// 5) Check the `curRoot()` result - it shall be the empty tree root with index 0.
// 6) Check the `curTree()` - shall be 1.
// 7) Check the `finalRoots(0)` - shall be as expected (the root of the tree with 16383 zero triads
// and the last non-zero triad).
// 8) Check `finalRoots(1)` is 0x00.
// 9) Repeat the steps 1-8 for switching on the new tree on the triad #98304.

import { ethers } from 'hardhat';
// SPDX-License-Identifier: MIT
import { expect } from 'chai';

// @ts-ignore
import { toBigNum, zeroTriadTreeRoot } from '../lib/utilities';
import { MockTriadIncrementalMerkleTrees } from '../types';
import { deployMockTrees } from './helpers/mockTriadTrees';
import { getTriadAt } from './data/triadTreeSample';

describe('IncrementalMerkleTree: Switching Tree ', function () {
    let trees: MockTriadIncrementalMerkleTrees;

    before(async () => {
        trees = await deployMockTrees();
    });

    describe('Tree #1', () => {
        before(async () => {
            expect(await trees.curTree()).to.equal('0');
        });

        after(async () => {
            expect(await trees.curTree()).to.equal('1');
        });

        describe('Inserting Triads', () => {
            describe('16383 triads', () => {
                let after16383thCallRoot;

                it('should simulate insertion of 16383 triads', async () => {
                    await trees.fakeNextLeafId(16382 * 4);

                    await expect(trees.internalInsertBatch(getTriadAt(16382)))
                        .to.emit(trees, 'InternalInsertBatch')
                        .withArgs(16382 * 4);

                    after16383thCallRoot = (await trees.curRoot())[0];
                });

                it('should set expected tree root with root cache index 1021', async () => {
                    await expectCurRootAndIndexAsExpected(
                        after16383thCallRoot,
                        1021, // (255 * 4) % (256 *4) + 1
                    );
                });

                it('should have the final root of 0', async () => {
                    expect(await trees.finalRoots(0)).to.equal(
                        ethers.constants.HashZero,
                    );
                });
            });

            describe('16384th call', () => {
                it('should insert the 16384th triad', async () => {
                    await expect(trees.internalInsertBatch(getTriadAt(16383)))
                        .to.emit(trees, 'InternalInsertBatch')
                        .withArgs(16383 * 4);
                });

                it('expected current root to be zero root', async () => {
                    expect((await trees.curRoot())[0]).to.equal(
                        zeroTriadTreeRoot,
                    );
                });

                xit('should "know" the final root of the 1st tree', async () => {
                    expect(await trees.finalRoots(0)).to.equal(
                        '0x0a6a3883732c35d7d21248d989d924704b4f535472bdb59c76f44e1a80ffa197',
                    );
                });

                it('should have zero for the final root of the 2st tree', async () => {
                    expect(await trees.finalRoots(1)).to.equal(
                        ethers.constants.HashZero,
                    );
                });
            });
        });
    });

    describe('Tree #2', () => {
        before(async () => {
            expect(await trees.curTree()).to.equal('1');
        });

        after(async () => {
            expect(await trees.curTree()).to.equal('2');
        });

        describe('Inserting Triads', () => {
            describe('16383 triads', () => {
                let after16383thCallRoot;

                it('should simulate insertion of 16383 triads', async () => {
                    await trees.fakeNextLeafId(32766 * 4);

                    await expect(trees.internalInsertBatch(getTriadAt(32766)))
                        .to.emit(trees, 'InternalInsertBatch')
                        .withArgs(32766 * 4);

                    after16383thCallRoot = (await trees.curRoot())[0];
                });

                it('should set expected tree root with root cache index 1021', async () => {
                    await expectCurRootAndIndexAsExpected(
                        after16383thCallRoot,
                        1021, // (255 * 4) % (256 *4) + 1
                    );
                });

                it('should have the final root of 0', async () => {
                    expect(await trees.finalRoots(1)).to.equal(
                        ethers.constants.HashZero,
                    );
                });
            });

            describe('16384th call', () => {
                it('should insert the 16384th triad', async () => {
                    await expect(trees.internalInsertBatch(getTriadAt(32767)))
                        .to.emit(trees, 'InternalInsertBatch')
                        .withArgs(32767 * 4);
                });

                it('expected current root to be zero root', async () => {
                    expect((await trees.curRoot())[0]).to.equal(
                        zeroTriadTreeRoot,
                    );
                });

                xit('should "know" the final root of the 2st tree', async () => {
                    expect(await trees.finalRoots(0)).to.equal(
                        '0x0a6a3883732c35d7d21248d989d924704b4f535472bdb59c76f44e1a80ffa197',
                    );
                });

                it('should have zero for the final root of the 3st tree', async () => {
                    expect(await trees.finalRoots(2)).to.equal(
                        ethers.constants.HashZero,
                    );
                });
            });
        });
    });

    async function expectCurRootAndIndexAsExpected(
        expRoot: string,
        expIndex: number,
    ) {
        expect((await trees.curRoot())[0]).to.equal(expRoot);
        expect((await trees.curRoot())[1]).to.equal(toBigNum(expIndex));
    }
});
