// SPDX-License-Identifier: MIT
// @ts-ignore
import { ethers } from 'hardhat';
import { expect } from 'chai';

import { toBigNum, zeroTriadTreeRoot } from '../lib/utilities';
import { takeSnapshot, revertSnapshot } from './helpers/hardhat';
import { MockTriadIncrementalMerkleTrees } from '../types';
import { deployMockTrees } from './helpers/mockTriadTrees';
import { dataForTreeChangeTest } from './data/triadTreeSample';

const {
    after16383thTriadFirstTreeRoot,
    after16384thTriadFirstTreeRoot,
    after32767thTriadSecondTreeRoot,
    after32768thTriadSecondTreeRoot,
} = dataForTreeChangeTest.roots;

const {
    for16383thCallTriad,
    for16384thCallTriad,
    for32767thCallTriad,
    for32768thCallTriad,
} = dataForTreeChangeTest.triads;

describe('TriadIncrementalMerkleTrees: Switching Tree ', function () {
    let snapshot;
    let trees: MockTriadIncrementalMerkleTrees;

    before(async () => {
        trees = await deployMockTrees();
        snapshot = await takeSnapshot();
    });

    after(async () => {
        await revertSnapshot(snapshot);
    });

    describe('Filling up the 1st tree', () => {
        describe('Before inserting triads', () => {
            it('should have the current tree Id being 0 (1st tree)', async () => {
                expect(await trees.curTree()).to.equal(0);
            });

            it('should have the final root of the 1st tree being undefined (0)', async () => {
                expect(await trees.finalRoots(0)).to.equal(
                    ethers.constants.HashZero,
                );
            });
        });

        describe('Inserting Triads', () => {
            describe('after 16383 triads inserted', () => {
                before(async () => {
                    // It fakes insertion of 16382 triads w/ zero leaves
                    await trees.fakeNextLeafId(16382 * 4);

                    // Insert the 16383rd triad
                    await expect(
                        trees.internalInsertBatch(for16383thCallTriad),
                    );
                });

                it('should have 49149 leaves', async () => {
                    expect(await trees.leavesNum()).to.be.equal(16383 * 3);
                });

                it('should have the current root as expected with the cache index 1021', async () => {
                    await expectCurRootAndCacheIndex(
                        after16383thTriadFirstTreeRoot,
                        1021, // (16383 * 4) % (256 * 4) + 1
                    );
                });

                it('should NOT "switch" to the 2nd tree', async () => {
                    expect(await trees.curTree()).to.equal(0);
                });

                it('should have the final root of the 1st tree being undefined (0)', async () => {
                    expect(await trees.finalRoots(0)).to.equal(
                        ethers.constants.HashZero,
                    );
                });
            });

            describe('insertion of the 16384th triad', () => {
                it('should insert the 16384th triad', async () => {
                    await expect(trees.internalInsertBatch(for16384thCallTriad))
                        .to.emit(trees, 'InternalInsertBatch')
                        .withArgs(16383 * 4);
                });

                it('should "switch" to the 2nd tree', async () => {
                    expect(await trees.curTree()).to.equal(1);
                });

                it('should set the current tree root equal to the empty tree root', async () => {
                    expect((await trees.curRoot())[0]).to.equal(
                        zeroTriadTreeRoot,
                    );
                });
            });

            describe('after 16384 triads inserted', () => {
                it('should have 49152 leaves', async () => {
                    expect(await trees.leavesNum()).to.be.equal(16384 * 3);
                });

                it('should "know" the final root of the 1st tree', async () => {
                    expect(await trees.finalRoots(0)).to.equal(
                        after16384thTriadFirstTreeRoot,
                    );
                });

                it('should have zero as the final root of the 2nd tree', async () => {
                    expect(await trees.finalRoots(1)).to.equal(
                        ethers.constants.HashZero,
                    );
                });
            });
        });
    });

    describe('Filling up the 2nd tree', () => {
        describe('Before inserting more triads', () => {
            it('should have the current tree Id being 1 (2nd tree)', async () => {
                expect(await trees.curTree()).to.equal(1);
            });

            it('should have the final root of the 2nd tree being undefined (0)', async () => {
                expect(await trees.finalRoots(1)).to.equal(
                    ethers.constants.HashZero,
                );
            });
        });

        describe('Inserting Triads', () => {
            describe('after 16383 more triads inserted', () => {
                before(async () => {
                    // It fakes insertion of 16382 more triads w/ zero leaves
                    await trees.fakeNextLeafId((16384 + 16382) * 4);

                    // Insert the 32767th triad
                    await expect(
                        trees.internalInsertBatch(for32767thCallTriad),
                    );
                });

                it('should have 98301 leaves', async () => {
                    expect(await trees.leavesNum()).to.be.equal(
                        (16384 + 16383) * 3,
                    );
                });

                it('should have the current root as expected with the cache index 1021', async () => {
                    await expectCurRootAndCacheIndex(
                        after32767thTriadSecondTreeRoot,
                        1021, // ((16384 + 16383) * 4) % (256 * 4) + 1
                    );
                });

                it('should NOT "switch" to the 3rd tree', async () => {
                    expect(await trees.curTree()).to.equal(1);
                });

                it('should have the final root of the 2nd tree undefined (0)', async () => {
                    expect(await trees.finalRoots(1)).to.equal(
                        ethers.constants.HashZero,
                    );
                });
            });

            describe('insertion of the 32768th triad', () => {
                it('should insert the 32768th triad', async () => {
                    await expect(trees.internalInsertBatch(for32768thCallTriad))
                        .to.emit(trees, 'InternalInsertBatch')
                        .withArgs(32767 * 4);
                });

                it('should "switch" to the 3rd tree', async () => {
                    expect(await trees.curTree()).to.equal(2);
                });

                it('should set the current tree root equal to the empty tree root', async () => {
                    expect((await trees.curRoot())[0]).to.equal(
                        zeroTriadTreeRoot,
                    );
                });
            });

            describe('after 32768 triads inserted', () => {
                it('should have 98304 leaves', async () => {
                    expect(await trees.leavesNum()).to.be.equal(32768 * 3);
                });

                it('should "know" the final root of the 1st tree', async () => {
                    expect(await trees.finalRoots(0)).to.equal(
                        after16384thTriadFirstTreeRoot,
                    );
                });

                it('should "know" the final root of the 2nd tree', async () => {
                    expect(await trees.finalRoots(1)).to.equal(
                        after32768thTriadSecondTreeRoot,
                    );
                });

                it('should have zero as the final root of the 3rd tree', async () => {
                    expect(await trees.finalRoots(2)).to.equal(
                        ethers.constants.HashZero,
                    );
                });
            });
        });
    });

    async function expectCurRootAndCacheIndex(
        expRoot: string,
        expIndex: number,
    ) {
        const [actRoot, actIndex] = await trees.curRoot();
        expect(actRoot).to.equal(expRoot);
        expect(actIndex).to.equal(toBigNum(expIndex));
    }
});
