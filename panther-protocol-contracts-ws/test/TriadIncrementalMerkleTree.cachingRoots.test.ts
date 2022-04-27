// TODO: test wrapping of cached roots around 256th and 512th inserted triads
// Start from the empty tree and then...
// 1) Insert the 1st triad with `internalInsertBatch`, save the `curRoot()` result, check the cache
// index 5 = (1 * 4) % (256 *4) + 1.
// 2) Insert the 2nd triad with `internalInsertBatch`, save the `curRoot()` request result, check the cache
// index 9 = (2 * 4) % (256 *4) + 1.
// 3) Simulate insertion of another 253 triads with `fakeNextLeafId(255 * 4)`, save `curRoot()` result,
// check the cache index 1021 = (255 * 4) % (256 *4) + 1.
// 4) Insert the 256th triad with `internalInsertBatch`, save `curRoot()` result, check the cache index
// 1 = (256 * 4) % (256 *4) + 1.

// 5) Check `isKnownRoot` returns `true` for roots saved on steps 1), 2) 3) and 4) - twice for each root,
// with the cache index 0 (i.e. "default") and the index saved on these steps.

// 6) Insert the 257th triad with `internalInsertBatch`, save the `curRoot()` result, check the cache
// index 5 = (257 * 4) % (256 *4) + 1.

// 7) Check `isKnownRoot` returns `true` for roots saved on steps 2) and 6), and `false` for the root
// after step 1) - twice for each root (with the default and saved indexes).

// 8) Insert the 258th triad with `internalInsertBatch`, save the `curRoot()` result, check the cache
// index 9 = (258 * 4) % (256 *4) + 1.
// 9) Check `isKnownRoot` returns `true` for the root after the the steps 8), and `false` for roots
// after step 1) and 2) - twice for each root (with the default and saved indexes).
// 10) Simulate insertion of another 253 triads with `fakeNextLeafId(511 * 4)`, save `curRoot()` result,
// check the cache index 1021 = (511 * 4) % (256 *4) + 1.
// 11) Insert the 512th triad with `internalInsertBatch`, save `curRoot()` result, check the cache index
// 1 = (512 * 4) % (256 *4) + 1.
// 12) Check `isKnownRoot` returns `true` for roots after steps 6), 8) and 11), but `false` for roots
// after steps 1), 2) 3) and 4) - twice for each root (with the default and saved indexes),

// SPDX-License-Identifier: MIT
import { expect } from 'chai';

// @ts-ignore
import { toBigNum } from '../lib/utilities';
import { takeSnapshot, revertSnapshot } from './helpers/hardhat';
import { MockTriadIncrementalMerkleTrees } from '../types';
import { deployMockTrees } from './helpers/mockTriadTrees';
import { getTriadAt } from './data/triadTreeSample';

describe('TriadIncrementalMerkleTree: Caching Roots', () => {
    let trees: MockTriadIncrementalMerkleTrees;
    let snapshot: number;

    before(async () => {
        trees = await deployMockTrees();
    });

    describe('internal `insertBatch` method', function () {
        describe('when called 512 times with non-zero leaves', () => {
            let after1thCallRoot,
                after2thCallRoot,
                after255thCallRoot,
                after256thCallRoot,
                after257thCallRoot,
                after258thCallRoot,
                after511thCallRoot,
                after512thCallRoot;

            before(async () => {
                snapshot = await takeSnapshot();
            });

            after(async () => {
                await revertSnapshot(snapshot);
            });

            describe('add first 256 triads', () => {
                describe('the 1st call', () => {
                    it('should return the `leftLeafId` of 0', async () => {
                        await expect(trees.internalInsertBatch(getTriadAt(0)))
                            .to.emit(trees, 'InternalInsertBatch')
                            .withArgs(0);

                        after1thCallRoot = (await trees.curRoot())[0];
                    });

                    it('should set expected tree root with root cache index 5', async () => {
                        await expectCurRootAndIndexAsExpected(
                            after1thCallRoot,
                            4 + 1, // (1 * 4) % (256 *4) + 1
                        );
                    });
                });

                describe('the 2st call', () => {
                    it('should return the `leftLeafId` of 4', async () => {
                        await expect(trees.internalInsertBatch(getTriadAt(1)))
                            .to.emit(trees, 'InternalInsertBatch')
                            .withArgs(4);

                        after2thCallRoot = (await trees.curRoot())[0];
                    });

                    it('should set expected tree root with root cache index 9', async () => {
                        await expectCurRootAndIndexAsExpected(
                            after2thCallRoot,
                            9, // (2 * 4) % (256 *4) + 1
                        );
                    });
                });

                describe('the 255th call', () => {
                    it('should return the `leftLeafId` of 1016', async () => {
                        await trees.fakeNextLeafId(254 * 4);

                        await expect(trees.internalInsertBatch(getTriadAt(254)))
                            .to.emit(trees, 'InternalInsertBatch')
                            .withArgs(254 * 4);

                        after255thCallRoot = (await trees.curRoot())[0];
                    });

                    it('should set expected tree root with root cache index 1021', async () => {
                        await expectCurRootAndIndexAsExpected(
                            after255thCallRoot,
                            1021, // (255 * 4) % (256 *4) + 1
                        );
                    });
                });

                describe('the 256st call', () => {
                    it('should return the `leftLeafId` of 1020', async () => {
                        await expect(trees.internalInsertBatch(getTriadAt(255)))
                            .to.emit(trees, 'InternalInsertBatch')
                            .withArgs(1020);

                        after256thCallRoot = (await trees.curRoot())[0];
                    });

                    it('should set expected tree root with root cache index 1', async () => {
                        await expectCurRootAndIndexAsExpected(
                            after256thCallRoot,
                            1, // (256 * 4) % (256 *4) + 1
                        );
                    });
                });

                describe('the tree root set by 1th call', () => {
                    it('should be "known" under cache index 0', async () => {
                        expect(
                            await trees.isKnownRoot(0, after1thCallRoot, 0),
                        ).to.equal(true);
                    });

                    it('should be "known" under cache index 5', async () => {
                        expect(
                            await trees.isKnownRoot(0, after1thCallRoot, 4 + 1),
                        ).to.equal(true);
                    });
                });

                describe('the tree root set by 2th call', () => {
                    it('should be "known" under cache index 0', async () => {
                        expect(
                            await trees.isKnownRoot(0, after2thCallRoot, 0),
                        ).to.equal(true);
                    });

                    it('should be "known" under cache index 9', async () => {
                        expect(
                            await trees.isKnownRoot(0, after2thCallRoot, 9),
                        ).to.equal(true);
                    });
                });

                describe('the tree root set by 255th call', () => {
                    it('should be "known" under cache index 0', async () => {
                        expect(
                            await trees.isKnownRoot(0, after255thCallRoot, 0),
                        ).to.equal(true);
                    });

                    it('should be "known" under cache index 1021', async () => {
                        expect(
                            await trees.isKnownRoot(
                                0,
                                after255thCallRoot,
                                1021,
                            ),
                        ).to.equal(true);
                    });
                });

                describe('the tree root set by 256th call', () => {
                    it('should be "known" under cache index 0', async () => {
                        expect(
                            await trees.isKnownRoot(0, after256thCallRoot, 0),
                        ).to.equal(true);
                    });

                    it('should be "known" under cache index 1021', async () => {
                        expect(
                            await trees.isKnownRoot(0, after256thCallRoot, 1),
                        ).to.equal(true);
                    });
                });
            });

            describe('add second 256 triads', () => {
                describe('the 257st call', () => {
                    it('should return the `leftLeafId` of 1024', async () => {
                        await expect(trees.internalInsertBatch(getTriadAt(256)))
                            .to.emit(trees, 'InternalInsertBatch')
                            .withArgs(1024);

                        after257thCallRoot = (await trees.curRoot())[0];
                    });

                    it('should set expected tree root with root cache index 5', async () => {
                        await expectCurRootAndIndexAsExpected(
                            after257thCallRoot,
                            5, //(257 * 4) % (256 *4) + 1
                        );
                    });
                });

                describe('the 258st call', () => {
                    it('should return the `leftLeafId` of 1028', async () => {
                        await expect(trees.internalInsertBatch(getTriadAt(257)))
                            .to.emit(trees, 'InternalInsertBatch')
                            .withArgs(1028);

                        after258thCallRoot = (await trees.curRoot())[0];
                    });

                    it('should set expected tree root with root cache index 9', async () => {
                        await expectCurRootAndIndexAsExpected(
                            after258thCallRoot,
                            9, //(257 * 4) % (256 *4) + 1
                        );
                    });
                });

                describe('the 511th call', () => {
                    it('should return the `leftLeafId` of 2040', async () => {
                        await trees.fakeNextLeafId(510 * 4);

                        await expect(trees.internalInsertBatch(getTriadAt(510)))
                            .to.emit(trees, 'InternalInsertBatch')
                            .withArgs(510 * 4);

                        after511thCallRoot = (await trees.curRoot())[0];
                    });

                    it('should set expected tree root with root cache index 5', async () => {
                        await expectCurRootAndIndexAsExpected(
                            after511thCallRoot,
                            1021, // (255 * 4) % (256 *4) + 1
                        );
                    });
                });

                describe('the 512th call', () => {
                    it('should return the `leftLeafId` of 2044', async () => {
                        await expect(trees.internalInsertBatch(getTriadAt(511)))
                            .to.emit(trees, 'InternalInsertBatch')
                            .withArgs(511 * 4);

                        after512thCallRoot = (await trees.curRoot())[0];
                    });

                    it('should set expected tree root with root cache index 1', async () => {
                        await expectCurRootAndIndexAsExpected(
                            after512thCallRoot,
                            1, // (512 * 4) % (256 *4) + 1
                        );
                    });
                });

                describe('the tree root set by 1th call', () => {
                    it('should be "unknown" under cache index 0', async () => {
                        expect(
                            await trees.isKnownRoot(0, after1thCallRoot, 0),
                        ).to.equal(false);
                    });

                    it('should be "unknown" under cache index 5', async () => {
                        expect(
                            await trees.isKnownRoot(0, after1thCallRoot, 4 + 1),
                        ).to.equal(false);
                    });
                });

                describe('the tree root set by 2th call', () => {
                    it('should be "unknown" under cache index 0', async () => {
                        expect(
                            await trees.isKnownRoot(0, after2thCallRoot, 0),
                        ).to.equal(false);
                    });

                    it('should be "unknown" under cache index 9', async () => {
                        expect(
                            await trees.isKnownRoot(0, after2thCallRoot, 9),
                        ).to.equal(false);
                    });
                });

                describe('the tree root set by 255th call', () => {
                    it('should be "unknown" under cache index 0', async () => {
                        expect(
                            await trees.isKnownRoot(0, after255thCallRoot, 0),
                        ).to.equal(false);
                    });

                    it('should be "unknown" under cache index 1021', async () => {
                        expect(
                            await trees.isKnownRoot(
                                0,
                                after255thCallRoot,
                                1021,
                            ),
                        ).to.equal(false);
                    });
                });

                describe('the tree root set by 256th call', () => {
                    it('should be "unknown" under cache index 0', async () => {
                        expect(
                            await trees.isKnownRoot(0, after256thCallRoot, 0),
                        ).to.equal(false);
                    });

                    it('should be "unknown" under cache index 1021', async () => {
                        expect(
                            await trees.isKnownRoot(0, after256thCallRoot, 1),
                        ).to.equal(false);
                    });
                });

                describe('the tree root set by 257th call', () => {
                    it('should be "known" under cache index 0', async () => {
                        expect(
                            await trees.isKnownRoot(0, after257thCallRoot, 0),
                        ).to.equal(true);
                    });

                    it('should be "known" under cache index 5', async () => {
                        expect(
                            await trees.isKnownRoot(0, after257thCallRoot, 5),
                        ).to.equal(true);
                    });
                });

                describe('the tree root set by 258th call', () => {
                    it('should be "known" under cache index 0', async () => {
                        expect(
                            await trees.isKnownRoot(0, after258thCallRoot, 0),
                        ).to.equal(true);
                    });

                    it('should be "known" under cache index 9', async () => {
                        expect(
                            await trees.isKnownRoot(0, after258thCallRoot, 9),
                        ).to.equal(true);
                    });
                });

                describe('the tree root set by 512th call', () => {
                    it('should be "known" under cache index 0', async () => {
                        expect(
                            await trees.isKnownRoot(0, after512thCallRoot, 0),
                        ).to.equal(true);
                    });

                    it('should be "known" under cache index 1', async () => {
                        expect(
                            await trees.isKnownRoot(0, after512thCallRoot, 1),
                        ).to.equal(true);
                    });
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
