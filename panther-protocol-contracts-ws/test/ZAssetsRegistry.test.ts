// SPDX-License-Identifier: MIT
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { MockZAssetsRegistry } from '../types';
import {
    getIds,
    getMissingIds,
    getZAssets,
    getZeroZAsset,
    ZAsset,
    ZAssetStatus,
} from './data/zAssetsSample';
import { revertSnapshot, takeSnapshot } from './helpers/hardhat';

describe('ZAssetsRegistry', function () {
    let zAssetsRegistry: MockZAssetsRegistry;
    let snapshot;

    before(async () => {
        const ZAssetsRegistry = await ethers.getContractFactory(
            'MockZAssetsRegistry',
        );
        zAssetsRegistry =
            (await ZAssetsRegistry.deploy()) as MockZAssetsRegistry;
    });

    beforeEach(async () => {
        snapshot = await takeSnapshot();
    });

    afterEach(async () => {
        await revertSnapshot(snapshot);
    });

    describe('Internal addAsset', () => {
        it('should emit AssetAdded event', async () => {
            for (const zAsset of getZAssets()) {
                await expect(zAssetsRegistry.internalAddAsset(zAsset))
                    .to.emit(zAssetsRegistry, 'AssetAdded')
                    .withArgs(zAsset.token, Object.values(zAsset));
            }
        });

        it('should revert if zAsset is already added', async () => {
            const zAsset = getZAssets()[2];
            await addAsset(zAsset);
            await expect(
                zAssetsRegistry.internalAddAsset(zAsset),
            ).to.be.revertedWith('AR:E1');
        });

        it('should revert when token address is zero', async () => {
            const zAsset = getZAssets()[2];
            zAsset.token = ethers.constants.AddressZero;

            await expect(
                zAssetsRegistry.internalAddAsset(zAsset),
            ).to.be.revertedWith('AR:E4');
        });
    });

    describe('internal changeAssetStatus', () => {
        describe('for an asset has been added', () => {
            let rootId;
            let oldStatus;

            beforeEach(async () => {
                const zAsset = getZAssets()[2];
                oldStatus = zAsset.status;
                expect(oldStatus).to.be.equal(ZAssetStatus.ENABLED);
                await addAsset(zAsset);
                rootId = await zAssetsRegistry.getZAssetRootId(zAsset.token);
            });

            it('should update the zAsset status', async () => {
                await expect(
                    zAssetsRegistry.internalChangeAssetStatus(
                        rootId,
                        ZAssetStatus.DISABLED,
                    ),
                )
                    .to.emit(zAssetsRegistry, 'AssetStatusChanged')
                    .withArgs(rootId, ZAssetStatus.DISABLED, oldStatus);
            });

            it('should revert when status is same', async () => {
                await expect(
                    zAssetsRegistry.internalChangeAssetStatus(
                        rootId,
                        oldStatus,
                    ),
                ).to.be.revertedWith('AR:E3');
            });
        });

        describe('when an asset has not been added', () => {
            it('should revert if zAsset is not added yet', async () => {
                const { zAssetRootId } = getMissingIds()[1];
                await expect(
                    zAssetsRegistry.internalChangeAssetStatus(
                        zAssetRootId,
                        ZAssetStatus.DISABLED,
                    ),
                ).to.be.revertedWith('AR:E2');
            });
        });
    });

    describe('getZAsset', () => {
        beforeEach(addAllAssets);

        describe('if an asset has been added', () => {
            it('should return zAsset', async () => {
                for (const expected of getZAssets()) {
                    const actual = await zAssetsRegistry.getZAsset(
                        expected.token,
                    );
                    checkZAssetProperties(expected, actual);
                }
            });
        });

        describe('if an asset has not been added', () => {
            it('should return zero values', async () => {
                for (const { zAssetRootId } of getMissingIds()) {
                    const actual = await zAssetsRegistry.getZAsset(
                        zAssetRootId,
                    );
                    checkZAssetProperties(getZeroZAsset(), actual);
                }
            });
        });
    });

    describe('getZAssetAndId', () => {
        beforeEach(addAllAssets);

        describe('if an asset has been added', () => {
            it('should get asset along with its zAssetId', async () => {
                for (const {
                    token,
                    tokenId,
                    zAssetId: expectedZAssetId,
                } of getIds()) {
                    const expected = Object.assign(
                        getZeroZAsset(),
                        getZAssets().find(e => e.token == token),
                    );
                    const { asset: actual, zAssetId: actualZAssetId } =
                        await zAssetsRegistry.getZAssetAndId(
                            expected.token,
                            tokenId,
                        );

                    checkZAssetProperties(expected, actual);
                    expect(actualZAssetId).to.equal(
                        expectedZAssetId,
                        'zAssetId',
                    );
                }
            });
        });

        describe('if an asset has not been added', () => {
            it('should return zero values in `zAsset`', async () => {
                for (const missing of getMissingIds()) {
                    const { asset: actual } =
                        await zAssetsRegistry.getZAssetAndId(
                            missing.token,
                            missing.tokenId,
                        );
                    checkZAssetProperties(getZeroZAsset(), actual);
                }
            });

            it('should return zero `zAssetId`', async () => {
                for (const { token, tokenId } of getMissingIds()) {
                    const { zAssetId } = await zAssetsRegistry.getZAssetAndId(
                        token,
                        tokenId,
                    );
                    expect(zAssetId).to.equal(0);
                }
            });
        });
    });

    describe('getZAssetRootId', () => {
        it('should get asset root id been zAsset.token', async () => {
            for (const { token, zAssetRootId } of getIds()) {
                expect(await zAssetsRegistry.getZAssetRootId(token)).to.be.eq(
                    zAssetRootId,
                );
            }
        });
    });

    describe('isZAssetWhitelisted', () => {
        let rootId;
        beforeEach(async () => {
            const zAsset = getZAssets()[0];
            await addAsset(zAsset);
            rootId = await zAssetsRegistry.getZAssetRootId(zAsset.token);
        });

        it('should return true if rootId is whitelisted', async () => {
            expect(await zAssetsRegistry.isZAssetWhitelisted(rootId)).to.be
                .true;
        });

        it('should return false if rootId is not whitelisted', async () => {
            const anotherMissingZAsset = getZAssets()[1];
            const anotherMissingRootId = await zAssetsRegistry.getZAssetRootId(
                anotherMissingZAsset.token,
            );

            expect(
                await zAssetsRegistry.isZAssetWhitelisted(anotherMissingRootId),
            ).to.be.false;
        });
    });

    describe('scaleAmount', () => {
        const amount = ethers.BigNumber.from('1234567890123456789012');

        it('should not change the amount when scale is 0', async () => {
            expect(await zAssetsRegistry.scaleAmount(amount, 0)).to.be.eq(
                amount,
            );
        });

        it('should revert if scale is 8', async () => {
            await expect(zAssetsRegistry.unscaleAmount(amount, 8)).to.be
                .reverted;
        });

        it('should revert if scale is 16 or grater', async () => {
            await expect(zAssetsRegistry.unscaleAmount(amount, 16)).to.be
                .reverted;
            await expect(zAssetsRegistry.unscaleAmount(amount, 131)).to.be
                .reverted;
        });

        it('should divide the amount by 1e1 when scale is 1 ', async () => {
            expect(await zAssetsRegistry.scaleAmount(amount, 1)).to.be.eq(
                amount.div(1e1),
            );
        });

        it('should divide the amount by 1e2 when amount scale is 2 ', async () => {
            expect(await zAssetsRegistry.scaleAmount(amount, 2)).to.be.eq(
                amount.div(1e2),
            );
        });

        it('should divide the amount by 1e3 when amount scale is 3 ', async () => {
            expect(await zAssetsRegistry.scaleAmount(amount, 3)).to.be.eq(
                amount.div(1e3),
            );
        });

        it('should divide the amount by 1e4 when amount scale is 4 ', async () => {
            expect(await zAssetsRegistry.scaleAmount(amount, 4)).to.be.eq(
                amount.div(1e4),
            );
        });

        it('should divide the amount by 1e5 when amount scale is 5 ', async () => {
            expect(await zAssetsRegistry.scaleAmount(amount, 5)).to.be.eq(
                amount.div(1e5),
            );
        });

        it('should divide the amount by 1e6 when amount scale is 6 ', async () => {
            expect(await zAssetsRegistry.scaleAmount(amount, 6)).to.be.eq(
                amount.div(1e6),
            );
        });

        it('should divide the amount by 1e7 when amount scale is 7 ', async () => {
            expect(await zAssetsRegistry.scaleAmount(amount, 7)).to.be.eq(
                amount.div(1e7),
            );
        });

        it('should multiply the amount by 1e1 when amount scale is 9 ', async () => {
            expect(await zAssetsRegistry.scaleAmount(amount, 9)).to.be.eq(
                amount.mul(1e1),
            );
        });

        it('should multiply the amount by 1e2 when amount scale is 10 ', async () => {
            expect(await zAssetsRegistry.scaleAmount(amount, 10)).to.be.eq(
                amount.mul(1e2),
            );
        });

        it('should multiply the amount by 1e3 when amount scale is 11 ', async () => {
            expect(await zAssetsRegistry.scaleAmount(amount, 11)).to.be.eq(
                amount.mul(1e3),
            );
        });

        it('should multiply the amount by 1e4 when amount scale is 12 ', async () => {
            expect(await zAssetsRegistry.scaleAmount(amount, 12)).to.be.eq(
                amount.mul(1e4),
            );
        });

        it('should multiply the amount by 1e5 when amount scale is 13 ', async () => {
            expect(await zAssetsRegistry.scaleAmount(amount, 13)).to.be.eq(
                amount.mul(1e5),
            );
        });

        it('should multiply the amount by 1e6 when amount scale is 14 ', async () => {
            expect(await zAssetsRegistry.scaleAmount(amount, 14)).to.be.eq(
                amount.mul(1e6),
            );
        });

        it('should multiply the amount by 1e7 when amount scale is 15 ', async () => {
            expect(await zAssetsRegistry.scaleAmount(amount, 15)).to.be.eq(
                amount.mul(1e7),
            );
        });
    });

    describe('unscaleAmount', () => {
        const amount = ethers.BigNumber.from('32109876543210987654321');

        it('should not change the amount when scale is 0', async () => {
            expect(await zAssetsRegistry.scaleAmount(amount, 0)).to.be.eq(
                amount,
            );
        });

        it('should revert if scale is 8', async () => {
            await expect(zAssetsRegistry.unscaleAmount(amount, 8)).to.be
                .reverted;
        });

        it('should revert if scale is 16 or grater', async () => {
            await expect(zAssetsRegistry.unscaleAmount(amount, 16)).to.be
                .reverted;
            await expect(zAssetsRegistry.unscaleAmount(amount, 131)).to.be
                .reverted;
        });

        it('should multiple the amount by 1e1 when amount scale is 1 ', async () => {
            expect(await zAssetsRegistry.unscaleAmount(amount, 1)).to.be.eq(
                amount.mul(1e1),
            );
        });

        it('should multiple the amount by 1e2 when amount scale is 2', async () => {
            expect(await zAssetsRegistry.unscaleAmount(amount, 2)).to.be.eq(
                amount.mul(1e2),
            );
        });

        it('should multiple the amount by 1e3 when amount scale is 3 ', async () => {
            expect(await zAssetsRegistry.unscaleAmount(amount, 3)).to.be.eq(
                amount.mul(1e3),
            );
        });

        it('should multiple the amount by 1e4 when amount scale is 4', async () => {
            expect(await zAssetsRegistry.unscaleAmount(amount, 4)).to.be.eq(
                amount.mul(1e4),
            );
        });

        it('should multiple the amount by 1e5 when amount scale is 5', async () => {
            expect(await zAssetsRegistry.unscaleAmount(amount, 5)).to.be.eq(
                amount.mul(1e5),
            );
        });

        it('should multiple the amount by 1e6 when amount scale is 6', async () => {
            expect(await zAssetsRegistry.unscaleAmount(amount, 6)).to.be.eq(
                amount.mul(1e6),
            );
        });

        it('should multiple the amount by 1e7 when amount scale is 7', async () => {
            expect(await zAssetsRegistry.unscaleAmount(amount, 7)).to.be.eq(
                amount.mul(1e7),
            );
        });

        it('should divide the amount by 1e1 when amount scale is 9', async () => {
            expect(await zAssetsRegistry.unscaleAmount(amount, 9)).to.be.eq(
                amount.div(1e1),
            );
        });

        it('should divide the amount by 1e2 when amount scale is 10', async () => {
            expect(await zAssetsRegistry.unscaleAmount(amount, 10)).to.be.eq(
                amount.div(1e2),
            );
        });

        it('should divide the amount by 1e3 when amount scale is 11', async () => {
            expect(await zAssetsRegistry.unscaleAmount(amount, 11)).to.be.eq(
                amount.div(1e3),
            );
        });

        it('should divide the amount by 1e4 when amount scale is 12', async () => {
            expect(await zAssetsRegistry.unscaleAmount(amount, 12)).to.be.eq(
                amount.div(1e4),
            );
        });

        it('should divide the amount by 1e5 when amount scale is 13', async () => {
            expect(await zAssetsRegistry.unscaleAmount(amount, 13)).to.be.eq(
                amount.div(1e5),
            );
        });

        it('should divide the amount by 1e6 when amount scale is 14 ', async () => {
            expect(await zAssetsRegistry.unscaleAmount(amount, 14)).to.be.eq(
                amount.div(1e6),
            );
        });

        it('should divide the amount by 1e7 when amount scale is 15 ', async () => {
            expect(await zAssetsRegistry.unscaleAmount(amount, 15)).to.be.eq(
                amount.div(1e7),
            );
        });
    });

    async function addAsset(zAsset: ZAsset) {
        await zAssetsRegistry.internalAddAsset(zAsset);
    }

    async function addAllAssets() {
        for (const zAsset of getZAssets()) {
            await addAsset(zAsset);
        }
    }

    function checkZAssetProperties(
        expected: ZAsset,
        actual: { [key: string]: any },
    ): void {
        expect(actual.status, 'status').to.equal(expected.status);
        expect(actual.tokenType, 'tokenType').to.equal(expected.tokenType);
        expect(actual.scale, 'scale').to.equal(expected.scale);
        expect(actual.token, 'token').to.equal(expected.token);
    }
});
