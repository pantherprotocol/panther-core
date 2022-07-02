// SPDX-License-Identifier: MIT
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { ZAssetsRegistry } from '../types';
import {
    getIds,
    getMissingIds,
    getZAssets,
    getZeroZAsset,
    ZAsset,
    ZAssetStatus,
} from './data/zAssetsSample';
import { revertSnapshot, takeSnapshot } from './helpers/hardhat';
import { BigNumber } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describe('ZAssetsRegistry', function () {
    let zAssetsRegistry: ZAssetsRegistry;
    let owner: SignerWithAddress;
    let snapshot;

    before(async () => {
        [owner] = await ethers.getSigners();
        const ZAssetsRegistry = await ethers.getContractFactory(
            'ZAssetsRegistry',
        );
        zAssetsRegistry = (await ZAssetsRegistry.deploy(
            owner.address,
        )) as ZAssetsRegistry;
    });

    beforeEach(async () => {
        snapshot = await takeSnapshot();
    });

    afterEach(async () => {
        await revertSnapshot(snapshot);
    });

    describe('addAsset', () => {
        it('should emit AssetAdded event', async () => {
            for (const zAsset of getZAssets()) {
                await expect(zAssetsRegistry.addZAsset(zAsset))
                    .to.emit(zAssetsRegistry, 'AssetAdded')
                    .withArgs(zAsset.token, Object.values(zAsset));
            }
        });

        it('should revert if zAsset is already added', async () => {
            const zAsset = getZAssets()[2];
            await addAsset(zAsset);
            await expect(zAssetsRegistry.addZAsset(zAsset)).to.be.revertedWith(
                'AR:E1',
            );
        });

        it('should revert when token address is zero', async () => {
            const zAsset = getZAssets()[2];
            zAsset.token = ethers.constants.AddressZero;

            await expect(zAssetsRegistry.addZAsset(zAsset)).to.be.revertedWith(
                'AR:E7',
            );
        });
    });

    describe('changeAssetStatus', () => {
        describe('for an asset has been added', () => {
            let zAssetRecId: BigNumber;
            let oldStatus;

            beforeEach(async () => {
                const zAsset = getZAssets()[2];
                oldStatus = zAsset.status;
                expect(oldStatus).to.be.equal(ZAssetStatus.ENABLED);
                zAssetRecId = await addAsset(zAsset);
            });

            it('should update the zAsset status', async () => {
                await expect(
                    zAssetsRegistry.changeZAssetStatus(
                        zAssetRecId,
                        ZAssetStatus.DISABLED,
                    ),
                )
                    .to.emit(zAssetsRegistry, 'AssetStatusChanged')
                    .withArgs(zAssetRecId, ZAssetStatus.DISABLED, oldStatus);
            });

            it('should revert when status is same', async () => {
                await expect(
                    zAssetsRegistry.changeZAssetStatus(zAssetRecId, oldStatus),
                ).to.be.revertedWith('AR:E3');
            });
        });

        describe('when an asset has not been added', () => {
            it('should revert if zAsset is not added yet', async () => {
                const { zAssetRootId } = getMissingIds()[1];
                await expect(
                    zAssetsRegistry.changeZAssetStatus(
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

    describe('getZAssetAndIds', () => {
        beforeEach(addAllAssets);

        describe('if an asset has been added', () => {
            it('should get asset along with its IDs', async () => {
                for (const {
                    token,
                    tokenId: expectedTokenId,
                    zAssetId: expectedZAssetId,
                } of getIds()) {
                    const expected = Object.assign(
                        getZeroZAsset(),
                        getZAssets().find(e => e.token == token),
                    );
                    const {
                        asset: actual,
                        zAssetId: actualZAssetId,
                        _tokenId: actualTokenId,
                    } = await zAssetsRegistry.getZAssetAndIds(
                        expected.token,
                        expectedTokenId,
                    );

                    checkZAssetProperties(expected, actual);
                    expect(actualZAssetId).to.equal(
                        expectedZAssetId,
                        'zAssetId',
                    );
                    expect(actualTokenId).to.equal(expectedTokenId, '_tokenId');
                }
            });
        });

        describe('if an asset has not been added', () => {
            it('should return zero values in `zAsset`', async () => {
                for (const missing of getMissingIds()) {
                    const { asset: actual } =
                        await zAssetsRegistry.getZAssetAndIds(
                            missing.token,
                            missing.tokenId,
                        );
                    checkZAssetProperties(getZeroZAsset(), actual);
                }
            });

            it('should return zero `zAssetId`', async () => {
                for (const { token, tokenId } of getMissingIds()) {
                    const { zAssetId } = await zAssetsRegistry.getZAssetAndIds(
                        token,
                        tokenId,
                    );
                    expect(zAssetId).to.equal(0);
                }
            });

            it('should return zero `_tokenId`', async () => {
                for (const { token, tokenId } of getMissingIds()) {
                    const { _tokenId } = await zAssetsRegistry.getZAssetAndIds(
                        token,
                        tokenId,
                    );
                    expect(_tokenId).to.equal(0);
                }
            });

            it('should return zero `zAssetRecId`', async () => {
                for (const { token, tokenId } of getMissingIds()) {
                    const { zAssetRecId } =
                        await zAssetsRegistry.getZAssetAndIds(token, tokenId);
                    expect(zAssetRecId).to.equal(0);
                }
            });
        });
    });

    describe('isZAssetWhitelisted', () => {
        let zAssetRecId: BigNumber;
        beforeEach(async () => {
            const zAsset = getZAssets()[0];
            zAssetRecId = await addAsset(zAsset);
        });

        it('should return true if zAssetRecId is whitelisted', async () => {
            expect(await zAssetsRegistry.isZAssetWhitelisted(zAssetRecId)).to.be
                .true;
        });

        it('should return false if zAssetRecId is not whitelisted', async () => {
            const anotherMissingRootId = zAssetRecId.xor(33);
            expect(
                await zAssetsRegistry.isZAssetWhitelisted(anotherMissingRootId),
            ).to.be.false;
        });
    });

    async function addAsset(zAsset: ZAsset): Promise<BigNumber> {
        const tx = await zAssetsRegistry.addZAsset(zAsset);
        const rcp = await tx.wait();
        // event AssetAdded(uint160 indexed zAssetRecId, ...);
        return BigNumber.from(rcp.logs[0].topics[1]);
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
