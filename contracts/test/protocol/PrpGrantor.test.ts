// SPDX-License-Identifier: MIT
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import {BigNumber} from 'ethers';
import {ethers} from 'hardhat';

import {PrpGrantor} from '../../types/contracts';

import {revertSnapshot, takeSnapshot} from './helpers/hardhat';

describe('PrpGrantor contract', function () {
    // bytes4(keccak256("forAdvancedStakeGrant"))
    const grantType = '0x31a180d4';
    const grantType2 = '0x23232323';
    const undefinedGrantType = '0x12345678';
    const ownerGrantType = '0x479ed83f';
    const zeroGrantType = '0x00000000';

    const grantAmount = 523786;

    let snapshot;
    let prpGrantor: PrpGrantor;
    let deployer,
        grantProcessor,
        curatorOne,
        curatorTwo,
        grantee: SignerWithAddress;
    let maxPRPGrant: BigNumber;

    before(async function () {
        [deployer, grantProcessor, curatorOne, curatorTwo, grantee] =
            await ethers.getSigners();
        const PrpGrantor = await ethers.getContractFactory('PrpGrantor');
        prpGrantor = (await PrpGrantor.deploy(
            deployer.address,
            grantProcessor.address,
        )) as PrpGrantor;
    });

    beforeEach(async () => {
        snapshot = await takeSnapshot();
    });

    afterEach(async () => {
        await revertSnapshot(snapshot);
    });

    describe('function grantProcessor', () => {
        it('should return grantProcessor address provided to the constructor', async () => {
            expect(await prpGrantor.grantProcessor()).to.be.equal(
                grantProcessor.address,
            );
        });
    });

    describe('function getUnusedGrantAmount', () => {
        it('should return unused grant amount for a grantee', async () => {
            await prpGrantor.enableGrantType(
                curatorOne.address,
                grantType,
                grantAmount,
            );
            await prpGrantor
                .connect(curatorOne)
                .issueGrant(grantee.address, grantType);
            expect(
                await prpGrantor.getUnusedGrantAmount(grantee.address),
            ).to.be.equal(grantAmount);
        });
    });

    describe('function getGrantAmount', () => {
        describe('getting the grant amount for a curator of a certain grant type', () => {
            it('should revert if the grant type is undefined', async () => {
                await expect(
                    prpGrantor.getGrantAmount(
                        curatorOne.address,
                        undefinedGrantType,
                    ),
                ).to.be.reverted;
            });

            it('Should get the grant amount', async () => {
                await prpGrantor.enableGrantType(
                    curatorTwo.address,
                    grantType,
                    grantAmount,
                );
                expect(
                    await prpGrantor.getGrantAmount(
                        curatorTwo.address,
                        grantType,
                    ),
                ).to.be.equal(grantAmount);
            });
        });
    });

    describe('function issueGrant', () => {
        describe('issuing a grant for a grantee by a curator', () => {
            it('should revert when the curator tries to grant a zero grant type to a grantee', async () => {
                await expect(
                    prpGrantor
                        .connect(curatorOne)
                        .issueGrant(grantee.address, zeroGrantType),
                ).to.be.revertedWith('GR:E6');
            });

            it('should revert when the curator tries to grant a valid grant type to a zero address grantee', async () => {
                await expect(
                    prpGrantor
                        .connect(curatorOne)
                        .issueGrant(ethers.constants.AddressZero, grantType),
                ).to.be.revertedWith('GR:E2');
            });

            it('should revert when the curator tries to grant an undefined grant type', async () => {
                await expect(
                    prpGrantor
                        .connect(curatorOne)
                        .issueGrant(grantee.address, undefinedGrantType),
                ).to.be.revertedWith('GR:E8');
            });
        });

        describe('when a grant is enabled for a curator', () => {
            beforeEach(async () => {
                await prpGrantor.enableGrantType(
                    curatorOne.address,
                    grantType,
                    grantAmount,
                );
            });

            describe('curator grants a grant type to the grantee', () => {
                beforeEach(async () => {
                    expect(
                        await prpGrantor.getUnusedGrantAmount(grantee.address),
                    ).to.be.equal(0);
                    expect(await prpGrantor.totalGrantsIssued()).to.be.equal(0);
                    expect(await prpGrantor.totalGrantsRedeemed()).to.be.equal(
                        0,
                    );

                    await prpGrantor
                        .connect(curatorOne)
                        .issueGrant(grantee.address, grantType);
                });

                it('should emit the PrpGrantIssued event w/ expected params', async () => {
                    await expect(
                        await prpGrantor
                            .connect(curatorOne)
                            .issueGrant(grantee.address, grantType),
                    )
                        .to.emit(prpGrantor, 'PrpGrantIssued')
                        .withArgs(grantType, grantee.address, grantAmount);
                });

                it('should increase amount of unused grant for the grantee', async () => {
                    expect(
                        await prpGrantor.getUnusedGrantAmount(grantee.address),
                    ).to.be.equal(grantAmount);
                });

                it('should increase the total grants issued`', async () => {
                    expect(await prpGrantor.totalGrantsIssued()).to.be.equal(
                        grantAmount,
                    );
                });

                it('should not increase the total grants redeemed`', async () => {
                    expect(await prpGrantor.totalGrantsRedeemed()).to.be.equal(
                        0,
                    );
                });
            });
        });
    });

    describe('function issueOwnerGrant', () => {
        describe('issuing a grant for a grantee', () => {
            it('should revert if a non-owner is trying to issue the grant', async () => {
                await expect(
                    prpGrantor
                        .connect(curatorOne)
                        .issueOwnerGrant(grantee.address, grantAmount),
                ).to.be.revertedWith('ImmOwn: unauthorized');
            });

            it('should revert if the grantee is a zero address', async () => {
                await expect(
                    prpGrantor.issueOwnerGrant(
                        ethers.constants.AddressZero,
                        grantAmount,
                    ),
                ).to.be.revertedWith('GR:E2');
            });

            it('should revert if grant amount is greater than the maximum allowed PRP grant', async () => {
                maxPRPGrant = BigNumber.from(2 ** 32 + 1);
                await expect(
                    prpGrantor.issueOwnerGrant(grantee.address, maxPRPGrant),
                ).to.be.revertedWith('GR:E7');
            });
        });

        describe('owner can directly issue grant for a grantee', () => {
            beforeEach(async () => {
                expect(
                    await prpGrantor.getUnusedGrantAmount(grantee.address),
                ).to.be.equal(0);
                expect(await prpGrantor.totalGrantsIssued()).to.be.equal(0);
                expect(await prpGrantor.totalGrantsRedeemed()).to.be.equal(0);

                await prpGrantor.issueOwnerGrant(grantee.address, grantAmount);
            });

            it('should emit the PrpGrantIssued event w/ expected params', async () => {
                await expect(
                    await prpGrantor.issueOwnerGrant(
                        grantee.address,
                        grantAmount,
                    ),
                )
                    .to.emit(prpGrantor, 'PrpGrantIssued')
                    .withArgs(ownerGrantType, grantee.address, grantAmount);
            });

            it('should increase amount of unused grant for the grantee', async () => {
                expect(
                    await prpGrantor.getUnusedGrantAmount(grantee.address),
                ).to.be.equal(grantAmount);
            });

            it('should increase the total grants issued`', async () => {
                expect(await prpGrantor.totalGrantsIssued()).to.be.equal(
                    grantAmount,
                );
            });
        });
    });

    describe('function burnGrant', () => {
        const burnAmount = 500;

        beforeEach(async () => {
            await prpGrantor.enableGrantType(
                curatorOne.address,
                grantType,
                grantAmount,
            );
            await prpGrantor
                .connect(curatorOne)
                .issueGrant(grantee.address, grantType);
        });

        describe('burning PRP grant amount', () => {
            it('should revert if any account with no grants enabled (No PRP to spend) tries to burn', async () => {
                await expect(
                    prpGrantor.burnGrant(grantAmount),
                ).to.be.revertedWith('GR:E5');
            });

            it('should revert if the PRP balance of the caller is less than the PRP amount caller wants to burn', async () => {
                await expect(
                    prpGrantor.connect(grantee).burnGrant(grantAmount + 1),
                ).to.be.revertedWith('GR:E5');
            });

            it('should be able to burn grant from a valid PRP grant', async () => {
                expect(
                    await prpGrantor.getUnusedGrantAmount(grantee.address),
                ).to.be.equal(grantAmount);
                expect(await prpGrantor.totalGrantsIssued()).to.be.equal(
                    grantAmount,
                );
                await expect(prpGrantor.connect(grantee).burnGrant(burnAmount))
                    .to.emit(prpGrantor, 'PrpGrantBurnt')
                    .withArgs(grantee.address, burnAmount);
                expect(
                    await prpGrantor.getUnusedGrantAmount(grantee.address),
                ).to.be.equal(grantAmount - burnAmount);
                expect(await prpGrantor.totalGrantsIssued()).to.be.equal(
                    grantAmount - burnAmount,
                );
            });
        });
    });

    describe('function redeemGrant', () => {
        beforeEach(async () => {
            await prpGrantor.enableGrantType(
                curatorOne.address,
                grantType,
                grantAmount,
            );
            await prpGrantor
                .connect(curatorOne)
                .issueGrant(grantee.address, grantType);
        });

        describe('redeeming grant by grant processor', () => {
            it('should revert if a non-grant processor tries redeems the grants', async () => {
                await expect(
                    prpGrantor.redeemGrant(grantee.address, grantAmount),
                ).to.be.revertedWith('GR:Unauthorized');
            });

            it('should revert if the processor tries to withdraw more than the existing PRP balance for a grantee', async () => {
                await expect(
                    prpGrantor
                        .connect(grantProcessor)
                        .redeemGrant(grantee.address, grantAmount + 1),
                ).to.be.revertedWith('GR:E5');
            });
        });

        describe('redeem grant from a grantee', () => {
            it('grant processor should be able to redeem PRP amount from a grantee', async () => {
                expect(
                    await prpGrantor.getUnusedGrantAmount(grantee.address),
                ).to.be.equal(grantAmount);
                expect(await prpGrantor.totalGrantsIssued()).to.be.equal(
                    grantAmount,
                );
                expect(await prpGrantor.totalGrantsRedeemed()).to.be.equal(0);

                await expect(
                    prpGrantor
                        .connect(grantProcessor)
                        .redeemGrant(grantee.address, grantAmount),
                )
                    .to.emit(prpGrantor, 'PrpGrantRedeemed')
                    .withArgs(grantee.address, grantAmount);

                expect(
                    await prpGrantor.getUnusedGrantAmount(grantee.address),
                ).to.be.equal(0);
                expect(await prpGrantor.totalGrantsIssued()).to.be.equal(
                    grantAmount,
                );
                expect(await prpGrantor.totalGrantsRedeemed()).to.be.equal(
                    grantAmount,
                );
            });
        });
    });

    describe('function enableGrantType', () => {
        describe('enabling a grant type for a curator', () => {
            it('only owner should be able to enable a grant types for curators', async () => {
                const nonOwner = await prpGrantor.connect(curatorOne);
                await expect(
                    nonOwner.enableGrantType(
                        curatorOne.address,
                        grantType,
                        grantAmount,
                    ),
                ).to.be.revertedWith('ImmOwn: unauthorized');
            });

            it('should revert when the owner tries to enable a zero grant type for a curator', async () => {
                await expect(
                    prpGrantor.enableGrantType(
                        curatorOne.address,
                        zeroGrantType,
                        grantAmount,
                    ),
                ).to.be.revertedWith('GR:E6');
            });

            it('should revert when the owner tries to enable if the curator address is a null address', async () => {
                await expect(
                    prpGrantor.enableGrantType(
                        ethers.constants.AddressZero,
                        grantType,
                        grantAmount,
                    ),
                ).to.be.revertedWith('GR:E1');
            });

            it('should revert if the PRP amount is greater than the maximum allowed PRP grant', async () => {
                maxPRPGrant = BigNumber.from(2 ** 32 + 1);
                await expect(
                    prpGrantor.enableGrantType(
                        curatorOne.address,
                        grantType,
                        maxPRPGrant,
                    ),
                ).to.be.revertedWith('GR:E7');
            });

            it('should revert if the grant type is already enabled for a particular curator with a particular amount', async () => {
                await prpGrantor.enableGrantType(
                    curatorOne.address,
                    grantType,
                    grantAmount,
                );
                await expect(
                    prpGrantor.enableGrantType(
                        curatorOne.address,
                        grantType,
                        grantAmount,
                    ),
                ).to.be.revertedWith('GR:E3');
            });

            it('should revert when tried to enable an already added grant type for a curator with a different amount', async () => {
                await prpGrantor.enableGrantType(
                    curatorOne.address,
                    grantType,
                    grantAmount,
                );
                await expect(
                    prpGrantor.enableGrantType(
                        curatorOne.address,
                        grantType,
                        grantAmount + 1,
                    ),
                ).to.be.revertedWith('GR:E3');
            });

            it('should emit PrpGrantEnabled event w/ expected params', async () => {
                await expect(
                    prpGrantor.enableGrantType(
                        curatorOne.address,
                        grantType,
                        grantAmount,
                    ),
                )
                    .to.emit(prpGrantor, 'PrpGrantEnabled')
                    .withArgs(curatorOne.address, grantType, grantAmount);
            });

            it('should register the grant amount for the given curator and a given grant type', async () => {
                await prpGrantor.enableGrantType(
                    curatorOne.address,
                    grantType,
                    grantAmount,
                );
                expect(
                    await prpGrantor.getGrantAmount(
                        curatorOne.address,
                        grantType,
                    ),
                ).to.be.equal(grantAmount);
            });
        });

        describe('when the grant type for a given curator is already enabled', () => {
            beforeEach(async () => {
                await prpGrantor.enableGrantType(
                    curatorOne.address,
                    grantType,
                    grantAmount,
                );
            });

            it('should register the grant of the same type for another curator', async () => {
                await expect(
                    prpGrantor.enableGrantType(
                        curatorTwo.address,
                        grantType,
                        grantAmount,
                    ),
                )
                    .to.emit(prpGrantor, 'PrpGrantEnabled')
                    .withArgs(curatorTwo.address, grantType, grantAmount);
            });

            it('should register the grant of another type for the same curator', async () => {
                await expect(
                    prpGrantor.enableGrantType(
                        curatorOne.address,
                        grantType2,
                        grantAmount,
                    ),
                )
                    .to.emit(prpGrantor, 'PrpGrantEnabled')
                    .withArgs(curatorOne.address, grantType2, grantAmount);
            });
        });
    });

    describe('function disableGrantType', () => {
        before(async () => {
            await prpGrantor.enableGrantType(
                curatorOne.address,
                grantType,
                grantAmount,
            );
        });

        describe('disabling a grant type', () => {
            it('should revert if anyone besides owner is trying to disable a grant type', async () => {
                await expect(
                    prpGrantor
                        .connect(curatorOne)
                        .disableGrantType(curatorOne.address, grantType),
                ).to.be.revertedWith('ImmOwn: unauthorized');
            });

            it('should revert if the grant is a zero grant type', async () => {
                await expect(
                    prpGrantor.disableGrantType(
                        curatorOne.address,
                        zeroGrantType,
                    ),
                ).to.be.revertedWith('GR:E6');
            });

            it('should revert if grant type is undefined', async () => {
                await expect(
                    prpGrantor.disableGrantType(
                        curatorOne.address,
                        undefinedGrantType,
                    ),
                ).to.be.revertedWith('GR:E8');
            });

            it('should be able to disable a grant type for a curator', async () => {
                await expect(
                    prpGrantor.disableGrantType(curatorOne.address, grantType),
                )
                    .to.emit(prpGrantor, 'PrpGrantDisabled')
                    .withArgs(curatorOne.address, grantType);
                await expect(
                    prpGrantor.getGrantAmount(curatorOne.address, grantType),
                ).to.be.reverted;
            });
        });
    });
});
