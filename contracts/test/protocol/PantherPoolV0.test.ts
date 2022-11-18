// SPDX-License-Identifier: MIT
import {smock, FakeContract} from '@defi-wonderland/smock';
import {expect} from 'chai';
import {ethers} from 'hardhat';

import {MockPantherPoolV0, ZAssetsRegistry} from '../../types/contracts';

import {
    anotherFakeExitCommitment,
    depositSample,
    fakeExitCommitment,
    exitSample,
    getExitCommitment,
} from './data/depositAndFakeExitSample';
import {getIds, getZAssets} from './data/zAssetsSample';
import {
    getBlockTimestamp,
    mineBlock,
    revertSnapshot,
    takeSnapshot,
} from './helpers/hardhat';
import {deployPantherPoolV0} from './helpers/pantherPoolV0';

describe('PantherPoolV0', () => {
    let poolV0: MockPantherPoolV0;
    let zAssetsRegistry: FakeContract<ZAssetsRegistry>;
    let msgSenderAddress: string;
    let snapshot: number;

    before(async () => {
        msgSenderAddress = (await ethers.getSigners())[0].address;
        poolV0 = await deployPantherPoolV0();

        zAssetsRegistry = await smock.fake('ZAssetsRegistry', {
            address: await poolV0.ASSET_REGISTRY(),
        });
    });

    beforeEach(async () => {
        snapshot = await takeSnapshot();
    });

    afterEach(async () => {
        await revertSnapshot(snapshot);
    });

    describe('generateDeposits', () => {
        const {
            tokens,
            tokenIds,
            amounts,
            pubSpendingKeys,
            secrets,
            createdAtNum,
        } = depositSample;

        describe('when exit time is not configured', () => {
            it('should revert', async () => {
                await expect(
                    poolV0.generateDeposits(
                        tokens,
                        tokenIds,
                        amounts,
                        pubSpendingKeys,
                        secrets,
                        createdAtNum,
                    ),
                ).to.revertedWith('PP:E31');
            });
        });

        describe('when exit is configured', () => {
            before(async () => {
                await poolV0.updateExitTimes(await getBlockTimestamp(), 1);
                mockGetZAssetAndIds();
            });

            it('should execute', async () => {
                await poolV0.generateDeposits(
                    tokens,
                    tokenIds,
                    amounts,
                    pubSpendingKeys,
                    secrets,
                    createdAtNum,
                );
            });
        });
    });

    describe('commitToExit', () => {
        describe('when exit commitment has not yet been registered', () => {
            it('allows registration of an exit commitment', async () => {
                expect(await poolV0.commitToExit(fakeExitCommitment))
                    .to.emit(poolV0, 'ExitCommitment')
                    .withArgs(await getBlockTimestamp());
            });

            it('allows registration of another exit commitment', () => {
                it('allows registration of an exit commitment', async () => {
                    expect(await poolV0.commitToExit(fakeExitCommitment))
                        .to.emit(poolV0, 'ExitCommitment')
                        .withArgs(await getBlockTimestamp());

                    expect(await poolV0.commitToExit(anotherFakeExitCommitment))
                        .to.emit(poolV0, 'ExitCommitment')
                        .withArgs(await getBlockTimestamp());
                });
            });
        });

        describe('when exit commitment has been registered', () => {
            beforeEach(async () => {
                await poolV0.commitToExit(fakeExitCommitment);
            });

            it('reverts registration of the same commitment', () => {
                it('allows registration of an exit commitment', async () => {
                    await expect(
                        poolV0.commitToExit(fakeExitCommitment),
                    ).to.revertedWith('PP:E32');
                });
            });

            it('allows registration of another exit commitment', () => {
                it('allows registration of an exit commitment', async () => {
                    expect(await poolV0.commitToExit(anotherFakeExitCommitment))
                        .to.emit(poolV0, 'ExitCommitment')
                        .withArgs(await getBlockTimestamp());
                });
            });
        });
    });

    describe('exit', () => {
        const {
            token,
            subId,
            scaledAmount,
            creationTime,
            privSpendingKey,
            leafId,
            pathElements,
            merkleRoot,
            cacheIndexHint,
        } = exitSample;

        let exitTime: number;

        before(async () => {
            exitTime = (await getBlockTimestamp()) + 100;
            await poolV0.updateExitTimes(exitTime, 100);
        });

        describe('if exit commitment has been registered', () => {
            beforeEach(async () => {
                await poolV0.commitToExit(
                    getExitCommitment(privSpendingKey, msgSenderAddress),
                );
            });

            describe('when time now is less than exit time', () => {
                it('should revert', async () => {
                    await expect(
                        poolV0.exit(
                            token,
                            subId,
                            scaledAmount,
                            creationTime,
                            privSpendingKey,
                            leafId,
                            pathElements,
                            merkleRoot,
                            cacheIndexHint,
                        ),
                    ).to.revertedWith('PP:E30');
                });
            });

            describe('when time now is more than exit time', () => {
                beforeEach(async () => {
                    await mineBlock(exitTime + 1);
                });

                describe('but exit delay has not yet passed', () => {
                    it('should revert due to delay not passed', async () => {
                        await expect(
                            poolV0.exit(
                                token,
                                subId,
                                scaledAmount,
                                creationTime,
                                privSpendingKey,
                                leafId,
                                pathElements,
                                merkleRoot,
                                cacheIndexHint,
                            ),
                        ).to.revertedWith('PP:E33');
                    });
                });

                describe('and exit delay has already passed', () => {
                    beforeEach(async () => {
                        await mineBlock(exitTime + 200);
                    });

                    it('should revert due to wrong proof', async () => {
                        await expect(
                            poolV0.exit(
                                token,
                                subId,
                                scaledAmount,
                                creationTime,
                                privSpendingKey,
                                leafId,
                                pathElements,
                                merkleRoot,
                                cacheIndexHint,
                            ),
                        ).to.revertedWith('PP:E16');
                    });
                });
            });
        });

        describe('if exit commitment has not been registered', () => {
            describe('when time now is less than exit time', () => {
                it('should revert', async () => {
                    await expect(
                        poolV0.exit(
                            token,
                            subId,
                            scaledAmount,
                            creationTime,
                            privSpendingKey,
                            leafId,
                            pathElements,
                            merkleRoot,
                            cacheIndexHint,
                        ),
                    ).to.revertedWith('PP:E30');
                });
            });

            describe('when time now is more than exit time', () => {
                beforeEach(async () => {
                    await mineBlock(exitTime + 1);
                });

                it('should revert', async () => {
                    await expect(
                        poolV0.exit(
                            token,
                            subId,
                            scaledAmount,
                            creationTime,
                            privSpendingKey,
                            leafId,
                            pathElements,
                            merkleRoot,
                            cacheIndexHint,
                        ),
                    ).to.revertedWith('PP:E34');
                });
            });
        });
    });

    describe('updateExitTimes', () => {
        const newExitDelay = 333;

        describe('success', () => {
            it('should update the exit time and delay by owner', async () => {
                const newExitTime = (await getBlockTimestamp()) + 1000;

                expect(await poolV0.updateExitTimes(newExitTime, newExitDelay))
                    .to.emit(poolV0, 'ExitTimesUpdated')
                    .withArgs(newExitTime, newExitDelay);

                expect(await poolV0.exitTime()).to.be.eq(newExitTime);
            });
        });

        describe('failure', () => {
            it('should revert if new exit time is less than time now', async () => {
                const newExitTime = (await getBlockTimestamp()) + 1000;
                expect(await poolV0.updateExitTimes(newExitTime, newExitDelay))
                    .to.emit(poolV0, 'ExitTimesUpdated')
                    .withArgs(newExitTime, newExitDelay);

                const pastExitTime = (await getBlockTimestamp()) - 1;
                await expect(
                    poolV0.updateExitTimes(pastExitTime, newExitDelay),
                ).to.revertedWith('E1');
            });

            it('should revert if new exit delay is 0', async () => {
                const newExitTime = (await getBlockTimestamp()) + 1000;
                await expect(
                    poolV0.updateExitTimes(newExitTime, 0),
                ).to.revertedWith('E1');
            });

            it('should revert if called by non-owner', async () => {
                const [, nonOwner] = await ethers.getSigners();
                const newExitTime = (await getBlockTimestamp()) + 1000;

                await expect(
                    poolV0
                        .connect(nonOwner)
                        .updateExitTimes(newExitTime, newExitDelay),
                ).to.revertedWith('ImmOwn: unauthorized');
            });
        });
    });

    function mockGetZAssetAndIds() {
        const [sampleZAsset] = getZAssets();
        const [sampleIds] = getIds();

        zAssetsRegistry.getZAssetAndIds.returns([
            sampleIds.zAssetId,
            sampleIds.tokenId,
            sampleIds.zAssetRootId,
            sampleZAsset,
        ]);
    }
});
