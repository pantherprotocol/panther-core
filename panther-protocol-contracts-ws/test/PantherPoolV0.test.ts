// SPDX-License-Identifier: MIT
import { expect } from 'chai';

import { getBlockTimestamp } from './helpers/hardhat';
import { MockPantherPoolV0, ZAssetsRegistry } from '../types';

import { smock, FakeContract } from '@defi-wonderland/smock';

import { deployPantherPoolV0 } from './helpers/pantherPoolV0';
import { ethers } from 'hardhat';
import { getIds, getZAssets } from './data/zAssetsSample';
import { depositSample, exitSample } from './data/depositAndFakeExitSample';

describe('PantherPoolV0', () => {
    let poolV0: MockPantherPoolV0;
    let zAssetsRegistry: FakeContract<ZAssetsRegistry>;

    before(async () => {
        poolV0 = await deployPantherPoolV0();

        zAssetsRegistry = await smock.fake('ZAssetsRegistry', {
            address: await poolV0.ASSET_REGISTRY(),
        });
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
                await poolV0.updateExitTime(await getBlockTimestamp());
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

    describe('exit', () => {
        describe('when time now is less than exit time', () => {
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

            before(async () => {
                const newExitTime = (await getBlockTimestamp()) + 100;
                await poolV0.updateExitTime(newExitTime);
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
                ).to.revertedWith('PP:E30');
            });
        });
    });

    describe('updateExitTime', () => {
        describe('success', () => {
            it('should update the exit time by owner', async () => {
                const newExitTime = (await getBlockTimestamp()) + 1000;

                expect(await poolV0.updateExitTime(newExitTime))
                    .to.emit(poolV0, 'ExitTimeUpdated')
                    .withArgs(newExitTime);

                expect(await poolV0.exitTime()).to.be.eq(newExitTime);
            });
        });

        describe('failure', () => {
            it('should revert if new exit time is less than time now', async () => {
                await expect(poolV0.updateExitTime(1)).to.revertedWith('E1');
            });

            it('should revert if called by non-owner', async () => {
                const [, nonOwner] = await ethers.getSigners();

                await expect(
                    poolV0.connect(nonOwner).updateExitTime(1),
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
