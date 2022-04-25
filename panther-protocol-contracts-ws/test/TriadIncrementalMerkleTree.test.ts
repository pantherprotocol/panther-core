// SPDX-License-Identifier: MIT
import { expect } from 'chai';

// @ts-ignore
import { ethers } from 'hardhat';
import {
    toBigNum,
    zeroLeaf,
    zeroTriadTreeRoot,
    zeroLeavesTriad,
} from '../lib/utilities';
import {
    MockTriadIncrementalMerkleTrees,
    MockTriadIncrementalMerkleTrees__factory,
} from '../contracts/types';
import { triads, rootsSeen } from './data/triadTreeSample';
import {
    getPoseidonT3Contract,
    getPoseidonT4Contract,
} from '../lib/poseidonBuilder';

describe('IncrementalMerkleTree', () => {
    let trees: MockTriadIncrementalMerkleTrees;
    let TriadIncrementalMerkleTrees: MockTriadIncrementalMerkleTrees__factory;

    before(async () => {
        const PoseidonT3 = await getPoseidonT3Contract();
        const poseidonT3 = await PoseidonT3.deploy();
        await poseidonT3.deployed();

        const PoseidonT4 = await getPoseidonT4Contract();
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

        trees = await TriadIncrementalMerkleTrees.deploy();
        await trees.deployed();
    });

    describe('`getTreeId` method', () => {
        // function getTreeId(uint256 leafId) returns (uint256)
        it('should return 0 if called w/ `leafId` of 0', async () => {
            expect(await trees.getTreeId(0)).to.equal(0);
        });

        it('should return 0 if called w/ `leafId` of 2047', async () => {
            expect(await trees.getTreeId(2047)).to.equal(0);
        });

        it('should return 1 if called w/ `leafId` of 65536', async () => {
            expect(await trees.getTreeId(65536)).to.equal(1);
        });

        it('should return 31 if called w/ `leafId` of 2031616', async () => {
            expect(await trees.getTreeId(2031616)).to.equal(31);
        });

        it('should return 32 if called w/ `leafId` of 2097152', async () => {
            expect(await trees.getTreeId(2097152)).to.equal(32);
        });
    });

    describe('an empty tree', function () {
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

        it('should return empty tree as the current root with cache index 0', async () => {
            await expectCurRootAndIndexAsExpected(zeroTriadTreeRoot, 0);
        });

        it('should not "know" the empty tree root', async () => {
            expect(await trees.isKnownRoot(0, zeroTriadTreeRoot, 0)).to.equal(
                false,
            );
        });
    });

    describe('internal `insertBatch` method', function () {
        let promises: Promise<any>;

        describe('a call inserting 3 zero leaves', () => {
            beforeEach(async () => {
                trees = await TriadIncrementalMerkleTrees.deploy();
                await trees.deployed();

                promises = trees.internalInsertBatch(zeroLeavesTriad);
                await promises;
            });

            it('should insert 3 leaves at once', async () => {
                expect(await trees.leavesNum()).to.equal(3);
            });

            it('should emit the `CachedRoot` event', async () => {
                await expect(promises)
                    .to.emit(trees, 'CachedRoot')
                    .withArgs(0, zeroTriadTreeRoot);
            });

            it('should set the empty tree root as the current root with cache index 5', async () => {
                await expectCurRootAndIndexAsExpected(zeroTriadTreeRoot, 4 + 1);
            });

            it('should "get known" the empty tree root', async () => {
                expect(
                    await trees.isKnownRoot(0, zeroTriadTreeRoot, 0),
                ).to.equal(true);
            });
        });

        describe('when called 3 times with zero leaves', () => {
            before(async () => {
                trees = await TriadIncrementalMerkleTrees.deploy();
                await trees.deployed();
            });

            it('the 1st call should return `leftLeafIds` of 0', async () => {
                await expect(trees.internalInsertBatch(zeroLeavesTriad))
                    .to.emit(trees, 'InternalInsertBatch')
                    .withArgs(0);
            });

            it('the 2nd call should return `leftLeafIds` of 4', async () => {
                await expect(trees.internalInsertBatch(zeroLeavesTriad))
                    .to.emit(trees, 'InternalInsertBatch')
                    .withArgs(4);
            });

            it('the 3rd call should return `leftLeafIds` of 8', async () => {
                await expect(trees.internalInsertBatch(zeroLeavesTriad))
                    .to.emit(trees, 'InternalInsertBatch')
                    .withArgs(8);
            });

            it('should insert 9 leaves', async () => {
                expect(await trees.leavesNum()).to.equal(9);
            });

            it('should set the empty tree root as the current root with cache index 13', async () => {
                await expectCurRootAndIndexAsExpected(
                    zeroTriadTreeRoot,
                    3 * 4 + 1,
                );
            });
        });

        describe('when called 8 times with non-zero leaves', () => {
            let after6thCallRoot, after7thCallRoot;

            before(async () => {
                trees = await TriadIncrementalMerkleTrees.deploy();
                await trees.deployed();
            });

            describe('the 1st call', () => {
                it('should return the `leftLeafId` of 0', async () => {
                    await expect(trees.internalInsertBatch(triads[0]))
                        .to.emit(trees, 'InternalInsertBatch')
                        .withArgs(0);
                });

                it('should insert 3 leaves', async () => {
                    expect(await trees.leavesNum()).to.equal(3);
                });

                it('should set expected tree root with root cache index 5', async () => {
                    await expectCurRootAndIndexAsExpected(rootsSeen[0], 4 + 1);
                });
            });

            describe('the 2nd call', () => {
                it('should return the `leftLeafId` of 4', async () => {
                    await expect(trees.internalInsertBatch(triads[1]))
                        .to.emit(trees, 'InternalInsertBatch')
                        .withArgs(4);
                });

                it('should result in 6 leaves inserted', async () => {
                    expect(await trees.leavesNum()).to.equal(6);
                });

                it('should set expected tree root with root cache index 9', async () => {
                    await expectCurRootAndIndexAsExpected(
                        rootsSeen[1],
                        2 * 4 + 1,
                    );
                });
            });

            describe('the 3rd call', () => {
                it('should return the `leftLeafId` of 8', async () => {
                    await expect(trees.internalInsertBatch(triads[2]))
                        .to.emit(trees, 'InternalInsertBatch')
                        .withArgs(8);
                });

                it('should result in 9 leaves inserted', async () => {
                    expect(await trees.leavesNum()).to.equal(9);
                });

                it('should set expected tree root with root cache index 13', async () => {
                    await expectCurRootAndIndexAsExpected(
                        rootsSeen[2],
                        3 * 4 + 1,
                    );
                });
            });

            describe('the 8th call', () => {
                it('should return the `leftLeafId` of 28', async () => {
                    await trees.internalInsertBatch(triads[3]);
                    await trees.internalInsertBatch(triads[4]);
                    await trees.internalInsertBatch(triads[5]);
                    after6thCallRoot = (await trees.curRoot())[0];
                    await trees.internalInsertBatch(triads[6]);
                    after7thCallRoot = (await trees.curRoot())[0];
                    await expect(trees.internalInsertBatch(triads[7]))
                        .to.emit(trees, 'InternalInsertBatch')
                        .withArgs(28);
                });

                it('should result in 24 leaves inserted', async () => {
                    expect(await trees.leavesNum()).to.equal(24);
                });

                it('should set expected tree root with root cache index 17', async () => {
                    await expectCurRootAndIndexAsExpected(
                        rootsSeen[7],
                        8 * 4 + 1,
                    );
                });

                it('should set the empty tree root as unknown', async () => {
                    expect(
                        await trees.isKnownRoot(0, zeroTriadTreeRoot, 0),
                    ).to.equal(false);
                });

                // TODO: update tests for CACHED_ROOTS_NUM of 256 (not 4)
                it('should make "known" the tree roots after the four latest calls', async () => {
                    expect(
                        await trees.isKnownRoot(0, rootsSeen[7], 0),
                    ).to.equal(true);
                    expect(
                        await trees.isKnownRoot(
                            0,
                            rootsSeen[6],
                            (6 + 1) * 4 + 1,
                        ),
                    ).to.equal(true);
                    expect(
                        await trees.isKnownRoot(0, rootsSeen[5], 0),
                    ).to.equal(true);
                    expect(
                        await trees.isKnownRoot(0, rootsSeen[4], 0),
                    ).to.equal(true);
                });

                // TODO: write tests for CACHED_ROOTS_NUM of 256 (not 4)
                xit('Update needed: should make "unknown" the tree root after the 4th call', async () => {
                    expect(
                        await trees.isKnownRoot(0, rootsSeen[3], 0),
                    ).to.equal(false);
                });
            });

            describe('the tree root set by 6th call', () => {
                it('should be as expected', () => {
                    expect(after6thCallRoot).to.equal(rootsSeen[5]);
                });

                it('should be "known" under cache index 0', async () => {
                    expect(
                        await trees.isKnownRoot(0, rootsSeen[5], 0),
                    ).to.equal(true);
                });

                it('should be "known" under cache index 25', async () => {
                    expect(
                        await trees.isKnownRoot(0, rootsSeen[5], 6 * 4 + 1),
                    ).to.equal(true);
                });

                it('should be "unknown" under cache index 29', async () => {
                    expect(
                        await trees.isKnownRoot(0, rootsSeen[5], 29),
                    ).to.equal(false);
                });
            });

            // TODO: write tests for cache index when it wraps from 260 to 1
            describe('the tree root set by 7th call', () => {
                it('should be as expected', () => {
                    expect(after7thCallRoot).to.equal(rootsSeen[6]);
                });

                it('should be "known" under cache index 0', async () => {
                    expect(
                        await trees.isKnownRoot(0, rootsSeen[6], 0),
                    ).to.equal(true);
                });

                it('should be "known" under cache index 29', async () => {
                    expect(
                        await trees.isKnownRoot(0, rootsSeen[6], 7 * 4 + 1),
                    ).to.equal(true);
                });

                it('should be "unknown" under cache index 25', async () => {
                    expect(
                        await trees.isKnownRoot(0, rootsSeen[6], 25),
                    ).to.equal(false);
                });
            });
        });
    });

    describe('internal `_isFullTree` method', () => {
        // function internalIsFullTree(uint256 nextLeafId) returns (bool)
        it('should return `false`  if called w/ `nextLeafId` of 0', async () => {
            expect(await trees.internalIsFullTree(0)).to.equal(false);
        });

        it('should return `false`  if called w/ `nextLeafId` of 1', async () => {
            expect(await trees.internalIsFullTree(1)).to.equal(false);
        });

        it('should return `false`  if called w/ `nextLeafId` of 1535', async () => {
            expect(await trees.internalIsFullTree(1535)).to.equal(false);
        });

        it('should return `false`  if called w/ `nextLeafId` of 2043', async () => {
            expect(await trees.internalIsFullTree(2043)).to.equal(false);
        });

        it('should return `false`  if called w/ `nextLeafId` of 2048', async () => {
            expect(await trees.internalIsFullTree(2048)).to.equal(false);
        });

        it('should return `false`  if called w/ `nextLeafId` of 2049', async () => {
            expect(await trees.internalIsFullTree(2049)).to.equal(false);
        });

        it('should return `false`  if called w/ `nextLeafId` of 65531', async () => {
            expect(await trees.internalIsFullTree(65531)).to.equal(false);
        });

        it('should return `true`  if called w/ `nextLeafId` of 65532', async () => {
            expect(await trees.internalIsFullTree(65532)).to.equal(true);
        });

        it('should return `true`  if called w/ `nextLeafId` of 65533', async () => {
            expect(await trees.internalIsFullTree(65533)).to.equal(true);
        });

        it('should return `true`  if called w/ `nextLeafId` of 65534', async () => {
            expect(await trees.internalIsFullTree(65534)).to.equal(true);
        });

        it('should return `true`  if called w/ `nextLeafId` of 65535', async () => {
            expect(await trees.internalIsFullTree(65535)).to.equal(true);
        });

        it('should return `false`  if called w/ `nextLeafId` of 65536', async () => {
            expect(await trees.internalIsFullTree(65536)).to.equal(false);
        });

        it('should return `false`  if called w/ `nextLeafId` of 262139', async () => {
            expect(await trees.internalIsFullTree(262139)).to.equal(false);
        });

        it('should return `true`  if called w/ `nextLeafId` of 262140', async () => {
            expect(await trees.internalIsFullTree(262140)).to.equal(true);
        });

        it('should return `true`  if called w/ `nextLeafId` of 262141', async () => {
            expect(await trees.internalIsFullTree(262141)).to.equal(true);
        });

        it('should return `true`  if called w/ `nextLeafId` of 262142', async () => {
            expect(await trees.internalIsFullTree(262142)).to.equal(true);
        });

        it('should return `true`  if called w/ `nextLeafId` of 262143', async () => {
            expect(await trees.internalIsFullTree(262143)).to.equal(true);
        });

        it('should return `false`  if called w/ `nextLeafId` of 262144', async () => {
            expect(await trees.internalIsFullTree(262144)).to.equal(false);
        });
    });

    describe('internal `_nextLeafId2LeavesNum` method', () => {
        it('should return 0  if called w/ `nextLeafId` of 0', async () => {
            expect(await trees.internalNextLeafId2LeavesNum(0)).to.equal(0);
        });

        it('should return 1  if called w/ `nextLeafId` of 1', async () => {
            expect(await trees.internalNextLeafId2LeavesNum(1)).to.equal(1);
        });

        it('should return 2  if called w/ `nextLeafId` of 2', async () => {
            expect(await trees.internalNextLeafId2LeavesNum(2)).to.equal(2);
        });

        it('should return 3  if called w/ `nextLeafId` of 3', async () => {
            expect(await trees.internalNextLeafId2LeavesNum(3)).to.equal(3);
        });

        it('should return 3  if called w/ `nextLeafId` of 4', async () => {
            expect(await trees.internalNextLeafId2LeavesNum(4)).to.equal(3);
        });

        it('should return 1536  if called w/ `nextLeafId` of 2048', async () => {
            expect(await trees.internalNextLeafId2LeavesNum(2048)).to.equal(
                1536,
            );
        });

        it('should return 49152  if called w/ `nextLeafId` of 65536', async () => {
            expect(await trees.internalNextLeafId2LeavesNum(65536)).to.equal(
                49152,
            );
        });

        it('should return 786432  if called w/ `nextLeafId` of 1048576', async () => {
            expect(await trees.internalNextLeafId2LeavesNum(1048576)).to.equal(
                786432,
            );
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
