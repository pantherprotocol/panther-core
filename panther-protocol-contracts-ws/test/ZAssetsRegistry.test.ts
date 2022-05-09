// SPDX-License-Identifier: MIT
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { toBigNum } from '../lib/utilities';
import { MockZAssetsRegistry } from '../types';

enum ZAssetStatus {
    ENABLED = 1,
    DISABLED = 2,
    UNKNOWN = 0,
}

enum TokenTypes {
    ERC20 = 0,
    ERC721 = 1,
    ERC1155 = 11,
}

type ZAsset = {
    _unused: number;
    status: number;
    tokenType: number;
    scale: number;
    token: string;
};

const getZAssets = (): ZAsset[] => {
    return [
        {
            _unused: 0,
            status: ZAssetStatus.ENABLED,
            tokenType: TokenTypes.ERC20,
            scale: 0,
            token: ethers.Wallet.createRandom().address,
        },
        {
            _unused: 0,
            status: ZAssetStatus.ENABLED,
            tokenType: TokenTypes.ERC721,
            scale: 0,
            token: ethers.Wallet.createRandom().address,
        },
        {
            _unused: 0,
            status: ZAssetStatus.ENABLED,
            tokenType: TokenTypes.ERC1155,
            scale: 0,
            token: ethers.Wallet.createRandom().address,
        },
    ];
};

describe.only('ZAssetsRegistry', function () {
    let zAssetsRegistry: MockZAssetsRegistry;
    const zAssets = getZAssets();
    const zAssetToBeDisabled = zAssets[0];
    const disabledZAssetId = calculateId(zAssetToBeDisabled.token);

    before(async () => {
        const ZAssetsRegistry = await ethers.getContractFactory(
            'MockZAssetsRegistry',
        );
        zAssetsRegistry =
            (await ZAssetsRegistry.deploy()) as MockZAssetsRegistry;
    });

    describe('Add asset', () => {
        before(async () => {
            for (const zAsset of zAssets) {
                await expect(zAssetsRegistry.internalAddAsset(zAsset))
                    .to.emit(zAssetsRegistry, 'AssetAdded')
                    .withArgs(calculateId(zAsset.token), Object.values(zAsset));
            }
        });

        it('should get the zAsset', async () => {
            for (const zAsset of zAssets) {
                const expected = await zAssetsRegistry.getZAsset(
                    calculateId(zAsset.token),
                );

                checkZAssetProperties(zAsset, expected);
            }
        });

        it('should get asset along with its id', async () => {
            for (const zAsset of zAssets) {
                const { asset, zAssetId } =
                    await zAssetsRegistry.getZAssetAndId(zAsset.token, 0);

                checkZAssetProperties(zAsset, asset);

                expect(zAssetId).to.equal(calculateId(zAsset.token));
            }
        });

        it('should revert if zAsset is already added', () => {
            expect(
                zAssetsRegistry.internalAddAsset(zAssets[0]),
            ).to.be.revertedWith('AR:E1');
        });

        it('should revert when token address is zero', () => {
            zAssets[0].token = ethers.constants.AddressZero;

            expect(
                zAssetsRegistry.internalAddAsset(zAssets[0]),
            ).to.be.revertedWith('AR:E4');
        });
    });

    describe('Update zAsset', () => {
        it('should change the zAsset status', async () => {
            await expect(
                zAssetsRegistry.internalChangeAssetStatus(
                    disabledZAssetId,
                    ZAssetStatus.DISABLED,
                ),
            )
                .to.emit(zAssetsRegistry, 'AssetStatusChanged')
                .withArgs(
                    disabledZAssetId,
                    ZAssetStatus.DISABLED,
                    ZAssetStatus.ENABLED,
                );
        });

        it('should revert when status is same', async () => {
            await expect(
                zAssetsRegistry.internalChangeAssetStatus(
                    disabledZAssetId,
                    ZAssetStatus.DISABLED,
                ),
            ).to.revertedWith('AR:E3');
        });

        it('should revert if zAsset is not added yet', async () => {
            const wrongId = calculateId(ethers.Wallet.createRandom().address);

            await expect(
                zAssetsRegistry.internalChangeAssetStatus(
                    wrongId,
                    ZAssetStatus.DISABLED,
                ),
            ).to.revertedWith('AR:E2');
        });
    });

    describe('When scale/unscale amount', () => {
        const amount = ethers.utils.parseEther('100');

        describe('Scale', () => {
            describe('When scale down', () => {
                it('should divide the amount by 1e1 when amount scale is 2 ', async () => {
                    expect(
                        await zAssetsRegistry.scaleAmount(amount, 2),
                    ).to.be.eq(amount.div(1e1));
                });

                it('should divide the amount by 1e2 when amount scale is 4 ', async () => {
                    expect(
                        await zAssetsRegistry.scaleAmount(amount, 4),
                    ).to.be.eq(amount.div(1e2));
                });

                it('should divide the amount by 1e3 when amount scale is 6 ', async () => {
                    expect(
                        await zAssetsRegistry.scaleAmount(amount, 6),
                    ).to.be.eq(amount.div(1e3));
                });

                it('should divide the amount by 1e4 when amount scale is 8 ', async () => {
                    expect(
                        await zAssetsRegistry.scaleAmount(amount, 8),
                    ).to.be.eq(amount.div(1e4));
                });

                it('should divide the amount by 1e5 when amount scale is 10 ', async () => {
                    expect(
                        await zAssetsRegistry.scaleAmount(amount, 10),
                    ).to.be.eq(amount.div(1e5));
                });

                it('should divide the amount by 1e6 when amount scale is 12 ', async () => {
                    expect(
                        await zAssetsRegistry.scaleAmount(amount, 12),
                    ).to.be.eq(amount.div(1e6));
                });
            });

            describe('When scale up', () => {
                it('should multiply the amount by 1e1 when amount scale is 3 ', async () => {
                    expect(
                        await zAssetsRegistry.scaleAmount(amount, 3),
                    ).to.be.eq(amount.mul(1e1));
                });

                it('should multiply the amount by 1e2 when amount scale is 5 ', async () => {
                    expect(
                        await zAssetsRegistry.scaleAmount(amount, 5),
                    ).to.be.eq(amount.mul(1e2));
                });

                it('should multiply the amount by 1e3 when amount scale is 7 ', async () => {
                    expect(
                        await zAssetsRegistry.scaleAmount(amount, 7),
                    ).to.be.eq(amount.mul(1e3));
                });

                it('should multiply the amount by 1e4 when amount scale is 9 ', async () => {
                    expect(
                        await zAssetsRegistry.scaleAmount(amount, 9),
                    ).to.be.eq(amount.mul(1e4));
                });

                it('should multiply the amount by 1e5 when amount scale is 11 ', async () => {
                    expect(
                        await zAssetsRegistry.scaleAmount(amount, 11),
                    ).to.be.eq(amount.mul(1e5));
                });

                it('should multiply the amount by 1e6 when amount scale is 13 ', async () => {
                    expect(
                        await zAssetsRegistry.scaleAmount(amount, 13),
                    ).to.be.eq(amount.mul(1e6));
                });
            });

            it('should not change the amount when scale is 0', async () => {
                expect(await zAssetsRegistry.scaleAmount(amount, 0)).to.be.eq(
                    amount,
                );
            });

            it('should not change the amount when scale is 1', async () => {
                expect(await zAssetsRegistry.scaleAmount(amount, 1)).to.be.eq(
                    amount,
                );
            });

            it('should revert if scale is greater than 14', async () => {
                await expect(zAssetsRegistry.scaleAmount(amount, 14)).to
                    .reverted;
            });
        });

        describe('Unscale', () => {
            describe('When unscale up', () => {
                it('should multiple the amount by 1e1 when amount scale is 2 ', async () => {
                    expect(
                        await zAssetsRegistry.unscaleAmount(amount, 2),
                    ).to.be.eq(amount.mul(1e1));
                });

                it('should multiple the amount by 1e2 when amount scale is 4 ', async () => {
                    expect(
                        await zAssetsRegistry.unscaleAmount(amount, 4),
                    ).to.be.eq(amount.mul(1e2));
                });

                it('should multiple the amount by 1e3 when amount scale is 6 ', async () => {
                    expect(
                        await zAssetsRegistry.unscaleAmount(amount, 6),
                    ).to.be.eq(amount.mul(1e3));
                });

                it('should multiple the amount by 1e4 when amount scale is 8 ', async () => {
                    expect(
                        await zAssetsRegistry.unscaleAmount(amount, 8),
                    ).to.be.eq(amount.mul(1e4));
                });

                it('should multiple the amount by 1e5 when amount scale is 10 ', async () => {
                    expect(
                        await zAssetsRegistry.unscaleAmount(amount, 10),
                    ).to.be.eq(amount.mul(1e5));
                });
                it('should multiple the amount by 1e6 when amount scale is 12 ', async () => {
                    expect(
                        await zAssetsRegistry.unscaleAmount(amount, 12),
                    ).to.be.eq(amount.mul(1e6));
                });
            });

            describe('When unscale down', () => {
                it('should divide the amount by 1e1 when amount scale is 3', async () => {
                    expect(
                        await zAssetsRegistry.unscaleAmount(amount, 3),
                    ).to.be.eq(amount.div(1e1));
                });

                it('should divide the amount by 1e2 when amount scale is 5', async () => {
                    expect(
                        await zAssetsRegistry.unscaleAmount(amount, 5),
                    ).to.be.eq(amount.div(1e2));
                });

                it('should divide the amount by 1e3 when amount scale is 7', async () => {
                    expect(
                        await zAssetsRegistry.unscaleAmount(amount, 7),
                    ).to.be.eq(amount.div(1e3));
                });

                it('should divide the amount by 1e4 when amount scale is 9', async () => {
                    expect(
                        await zAssetsRegistry.unscaleAmount(amount, 9),
                    ).to.be.eq(amount.div(1e4));
                });

                it('should divide the amount by 1e5 when amount scale is 11', async () => {
                    expect(
                        await zAssetsRegistry.unscaleAmount(amount, 11),
                    ).to.be.eq(amount.div(1e5));
                });

                it('should divide the amount by 1e6 when amount scale is 13 ', async () => {
                    expect(
                        await zAssetsRegistry.unscaleAmount(amount, 13),
                    ).to.be.eq(amount.div(1e6));
                });
            });

            it('should not change the amount when scale is 0', async () => {
                expect(await zAssetsRegistry.unscaleAmount(amount, 0)).to.be.eq(
                    amount,
                );
            });

            it('should not change the amount when scale is 1', async () => {
                expect(await zAssetsRegistry.unscaleAmount(amount, 1)).to.be.eq(
                    amount,
                );
            });

            it('should revert if scale is greater than 14', async () => {
                await expect(zAssetsRegistry.unscaleAmount(amount, 14)).to
                    .reverted;
            });
        });
    });

    describe('isRootIdWhitelisted', () => {
        it('should return true if rootId is whitelisted', async () => {
            const id = calculateId(zAssets[1].token);

            expect(await zAssetsRegistry.isRootIdWhitelisted(id)).to.be.true;
        });
        it('should return false if rootId is not whitelisted', async () => {
            const randomId = calculateId(ethers.Wallet.createRandom().address);

            expect(await zAssetsRegistry.isRootIdWhitelisted(disabledZAssetId))
                .to.be.false;
            expect(await zAssetsRegistry.isRootIdWhitelisted(randomId)).to.be
                .false;
        });
    });

    describe('Asset root id', () => {
        it('should get asset root id', async () => {
            expect(
                await zAssetsRegistry.getZAssetRootId(zAssets[0].token),
            ).to.be.eq(toBigNum(zAssets[0].token));
        });
    });

    function checkZAssetProperties(
        zAsset: ZAsset,
        expected: { [key: string]: any },
    ): void {
        expect(expected.status).to.equal(zAsset.status);
        expect(expected.tokenType).to.equal(zAsset.tokenType);
        expect(expected.scale).to.equal(zAsset.scale);
        expect(expected.token).to.equal(zAsset.token);
    }

    function calculateId(token: string) {
        return toBigNum(
            ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ['uint', 'uint'],
                    [toBigNum(token), toBigNum(0)],
                ),
            ),
        ).div(toBigNum(2).pow(96));
    }
});
