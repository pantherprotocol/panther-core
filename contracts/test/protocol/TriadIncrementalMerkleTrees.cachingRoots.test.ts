// SPDX-License-Identifier: MIT
import {expect} from 'chai';

// @ts-ignore
import {toBigNum} from '../../lib/utilities';
import {MockTriadIncrementalMerkleTrees} from '../../types/contracts';

import {dataForCacheTest} from './data/triadTreeSample';
import {takeSnapshot, revertSnapshot} from './helpers/hardhat';
import {deployMockTrees} from './helpers/mockTriadTrees';

const {
    after1stCallRoot,
    after2ndCallRoot,
    after255thCallRoot,
    after256thCallRoot,
    after257thCallRoot,
    after258thCallRoot,
    after511thCallRoot,
    after512thCallRoot,
} = dataForCacheTest.roots;

const {
    for1stCallTriad,
    for2ndCallTriad,
    for255thCallTriad,
    for256thCallTriad,
    for257thCallTriad,
    for258thCallTriad,
    for511thCallTriad,
    for512thCallTriad,
} = dataForCacheTest.triads;

describe('TriadIncrementalMerkleTrees: Caching Roots', () => {
    let trees: MockTriadIncrementalMerkleTrees;
    let snapshot: number;

    before(async () => {
        trees = await deployMockTrees();
    });

    describe('internal `insertBatch` method', function () {
        before(async () => {
            snapshot = await takeSnapshot();
        });

        after(async () => {
            await revertSnapshot(snapshot);
        });

        describe('first 256 calls', () => {
            describe('the 1st call', () => {
                it('should return the `leftLeafId` of 0', async () => {
                    await expect(trees.internalInsertBatch(for1stCallTriad))
                        .to.emit(trees, 'InternalInsertBatch')
                        .withArgs(0);
                });

                it('should set expected tree root with root cache index 5', async () => {
                    await expectCurRootAndCacheIndex(
                        after1stCallRoot,
                        4 + 1, // (1 * 4) % (256 *4) + 1
                    );
                });
            });

            describe('the 2nd call', () => {
                it('should return the `leftLeafId` of 4', async () => {
                    await expect(trees.internalInsertBatch(for2ndCallTriad))
                        .to.emit(trees, 'InternalInsertBatch')
                        .withArgs(4);
                });

                it('should set expected tree root with root cache index 9', async () => {
                    await expectCurRootAndCacheIndex(
                        after2ndCallRoot,
                        9, // (2 * 4) % (256 *4) + 1
                    );
                });
            });

            describe('the 255th call', () => {
                it('should return the `leftLeafId` of 1016', async () => {
                    // Fake insertion of 252 zero triads
                    await trees.fakeNextLeafId((2 + 252) * 4);

                    await expect(trees.internalInsertBatch(for255thCallTriad))
                        .to.emit(trees, 'InternalInsertBatch')
                        .withArgs(254 * 4);
                });

                it('should set expected tree root with root cache index 1021', async () => {
                    await expectCurRootAndCacheIndex(
                        after255thCallRoot,
                        1021, // (255 * 4) % (256 *4) + 1
                    );
                });
            });

            describe('the 256th call', () => {
                it('should return the `leftLeafId` of 1020', async () => {
                    await expect(trees.internalInsertBatch(for256thCallTriad))
                        .to.emit(trees, 'InternalInsertBatch')
                        .withArgs(1020);
                });

                it('should set expected tree root with root cache index 1', async () => {
                    await expectCurRootAndCacheIndex(
                        after256thCallRoot,
                        1, // (256 * 4) % (256 *4) + 1
                    );
                });
            });

            describe('after 256 calls', () => {
                describe('the tree root set by 1st call', () => {
                    it('should be "known" under cache index 0', async () => {
                        expect(
                            await trees.isKnownRoot(0, after1stCallRoot, 0),
                        ).to.equal(true);
                    });

                    it('should be "known" under cache index 5', async () => {
                        expect(
                            await trees.isKnownRoot(0, after1stCallRoot, 4 + 1),
                        ).to.equal(true);
                    });
                });

                describe('the tree root set by 2nd call', () => {
                    it('should be "known" under cache index 0', async () => {
                        expect(
                            await trees.isKnownRoot(0, after2ndCallRoot, 0),
                        ).to.equal(true);
                    });

                    it('should be "known" under cache index 9', async () => {
                        expect(
                            await trees.isKnownRoot(0, after2ndCallRoot, 9),
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
        });

        describe('256 calls more', () => {
            describe('the 257st call', () => {
                it('should return the `leftLeafId` of 1024', async () => {
                    await expect(trees.internalInsertBatch(for257thCallTriad))
                        .to.emit(trees, 'InternalInsertBatch')
                        .withArgs(1024);
                });

                it('should set expected tree root with root cache index 5', async () => {
                    await expectCurRootAndCacheIndex(
                        after257thCallRoot,
                        5, //(257 * 4) % (256 *4) + 1
                    );
                });
            });

            describe('the 258st call', () => {
                it('should return the `leftLeafId` of 1028', async () => {
                    await expect(trees.internalInsertBatch(for258thCallTriad))
                        .to.emit(trees, 'InternalInsertBatch')
                        .withArgs(1028);
                });

                it('should set expected tree root with root cache index 9', async () => {
                    await expectCurRootAndCacheIndex(
                        after258thCallRoot,
                        9, //(257 * 4) % (256 *4) + 1
                    );
                });
            });

            describe('the 511th call', () => {
                it('should return the `leftLeafId` of 2040', async () => {
                    // Fake insertion of 525 zero triads
                    await trees.fakeNextLeafId((258 + 252) * 4);

                    await expect(trees.internalInsertBatch(for511thCallTriad))
                        .to.emit(trees, 'InternalInsertBatch')
                        .withArgs(510 * 4);
                });

                it('should set expected tree root with root cache index 5', async () => {
                    await expectCurRootAndCacheIndex(
                        after511thCallRoot,
                        1021, // (255 * 4) % (256 *4) + 1
                    );
                });
            });

            describe('the 512th call', () => {
                it('should return the `leftLeafId` of 2044', async () => {
                    await expect(trees.internalInsertBatch(for512thCallTriad))
                        .to.emit(trees, 'InternalInsertBatch')
                        .withArgs(511 * 4);
                });

                it('should set expected tree root with root cache index 1', async () => {
                    await expectCurRootAndCacheIndex(
                        after512thCallRoot,
                        1, // (512 * 4) % (256 *4) + 1
                    );
                });
            });

            describe('after 512 calls', () => {
                describe('the tree root set by 1st call', () => {
                    it('should be "unknown" under cache index 0', async () => {
                        expect(
                            await trees.isKnownRoot(0, after1stCallRoot, 0),
                        ).to.equal(false);
                    });

                    it('should be "unknown" under cache index 5', async () => {
                        expect(
                            await trees.isKnownRoot(0, after1stCallRoot, 4 + 1),
                        ).to.equal(false);
                    });
                });

                describe('the tree root set by 2nd call', () => {
                    it('should be "unknown" under cache index 0', async () => {
                        expect(
                            await trees.isKnownRoot(0, after2ndCallRoot, 0),
                        ).to.equal(false);
                    });

                    it('should be "unknown" under cache index 9', async () => {
                        expect(
                            await trees.isKnownRoot(0, after2ndCallRoot, 9),
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

    async function expectCurRootAndCacheIndex(
        expRoot: string,
        expIndex: number,
    ) {
        const [actRoot, actIndex] = await trees.curRoot();
        expect(actRoot).to.equal(expRoot);
        expect(actIndex).to.equal(toBigNum(expIndex));
    }
});
