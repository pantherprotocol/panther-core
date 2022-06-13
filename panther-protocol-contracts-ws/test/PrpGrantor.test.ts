// SPDX-License-Identifier: MIT
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
// import { toBigNum } from '../lib/utilities';
import { revertSnapshot, takeSnapshot } from './helpers/hardhat';
import { PrpGrantor } from '../types';

describe('PrpGrantor contract', function () {
    // bytes4(keccak256("forAdvancedStakeGrant"))
    const grantType = '0x31a180d4';
    // some random value
    const grantType2 = '0x23232323';

    let snapshot;
    let prpGrantor: PrpGrantor;
    let owner: SignerWithAddress;
    let grantProcessor: SignerWithAddress;
    let curator: SignerWithAddress;
    let curator2: SignerWithAddress;
    let grantee: SignerWithAddress;

    before(async function () {
        [owner, grantProcessor, curator, curator2, grantee] =
            await ethers.getSigners();
        const PrpGrantor = await ethers.getContractFactory('PrpGrantor');
        prpGrantor = (await PrpGrantor.deploy(
            owner.address,
            grantProcessor.address,
        )) as PrpGrantor;
    });

    beforeEach(async () => {
        snapshot = await takeSnapshot();
    });

    afterEach(async () => {
        await revertSnapshot(snapshot);
    });

    describe('after instantiation', () => {
        it('shall return grantProcessor address provided to the constructor', async () => {
            expect(await prpGrantor.grantProcessor()).to.be.equal(
                grantProcessor.address,
            );
        });
    });

    describe('function enableGrantType', () => {
        describe('when the grant type has not yet been enabled', () => {
            const grantAmount = 523786;

            it('it emits PrpGrantEnabled event w/ expected params', async () => {
                await expect(
                    prpGrantor.enableGrantType(
                        curator.address,
                        grantType,
                        grantAmount,
                    ),
                )
                    .to.emit(prpGrantor, 'PrpGrantEnabled')
                    .withArgs(curator.address, grantType, grantAmount);
            });

            it('it registers the grant amount for the given curator and grant type', async () => {
                await prpGrantor.enableGrantType(
                    curator.address,
                    grantType,
                    grantAmount,
                );
                expect(
                    await prpGrantor.getGrantAmount(curator.address, grantType),
                ).to.be.equal(grantAmount);
            });
        });

        describe('when the grant type for a given curator is already enabled', () => {
            const grantAmount = 323756;

            beforeEach(async () => {
                await prpGrantor.enableGrantType(
                    curator.address,
                    grantType,
                    grantAmount,
                );
            });

            it('reverts the call for the same grant type, curator and grant amount', async () => {
                await expect(
                    prpGrantor.enableGrantType(
                        curator.address,
                        grantType,
                        grantAmount,
                    ),
                ).to.be.revertedWith('GR:E3');
            });

            it('reverts the call for the same grant type, curator but of a different grant amount', async () => {
                await expect(
                    prpGrantor.enableGrantType(
                        curator.address,
                        grantType,
                        grantAmount - 1,
                    ),
                ).to.be.revertedWith('GR:E3');
            });

            it('it registers the grant of the same type for another curator', async () => {
                await expect(
                    prpGrantor.enableGrantType(
                        curator2.address,
                        grantType,
                        grantAmount,
                    ),
                )
                    .to.emit(prpGrantor, 'PrpGrantEnabled')
                    .withArgs(curator2.address, grantType, grantAmount);
            });

            it('it registers the grant of another type for the same curator', async () => {
                await expect(
                    prpGrantor.enableGrantType(
                        curator.address,
                        grantType2,
                        grantAmount,
                    ),
                )
                    .to.emit(prpGrantor, 'PrpGrantEnabled')
                    .withArgs(curator.address, grantType2, grantAmount);
            });
        });
    });

    describe('function disableGrantType', () => {
        describe('', () => {
            before(() => {});

            xit('', async () => {});
        });
    });

    describe('function issueGrant', () => {
        const grantAmount = 123;

        describe('When a grant is enabled', () => {
            beforeEach(async () => {
                await prpGrantor.enableGrantType(
                    curator.address,
                    grantType,
                    grantAmount,
                );
            });

            describe('for a grantee who has not been given grants before', () => {
                let rcp;
                beforeEach(async () => {
                    expect(
                        await prpGrantor.getUnusedGrantAmount(grantee.address),
                    ).to.be.equal(0);
                    expect(await prpGrantor.totalGrantsIssued()).to.be.equal(0);
                    expect(await prpGrantor.totalGrantsRedeemed()).to.be.equal(
                        0,
                    );

                    const tx = await prpGrantor
                        .connect(curator)
                        .issueGrant(grantee.address, grantType);
                    rcp = await tx.wait();
                });

                xit('shall emit the PrpGrantIssued event w/ expected params', () => {
                    expect(rcp.logs);
                });

                it('shall increase amount of "unused grant" for the grantee', async () => {
                    expect(
                        await prpGrantor.getUnusedGrantAmount(grantee.address),
                    ).to.be.equal(grantAmount);
                });

                it('shall increase the `totalGrantsIssued`', async () => {
                    expect(await prpGrantor.totalGrantsIssued()).to.be.equal(
                        grantAmount,
                    );
                });

                it('shall not increase the `totalGrantsRedeemed`', async () => {
                    expect(await prpGrantor.totalGrantsRedeemed()).to.be.equal(
                        0,
                    );
                });
            });
        });
    });

    describe('function redeemGrant', () => {
        const grantAmount = 88888888;

        describe('When a a grantee has been given a grant', () => {
            beforeEach(async () => {
                await prpGrantor.enableGrantType(
                    curator.address,
                    grantType,
                    grantAmount,
                );
                await prpGrantor
                    .connect(curator)
                    .issueGrant(grantee.address, grantType);
            });

            describe('when called w/ the amount not exceeding the granted amount', () => {
                let rcp;
                beforeEach(async () => {
                    expect(
                        await prpGrantor.getUnusedGrantAmount(grantee.address),
                    ).to.be.equal(grantAmount);
                    expect(await prpGrantor.totalGrantsIssued()).to.be.equal(
                        grantAmount,
                    );
                    expect(await prpGrantor.totalGrantsRedeemed()).to.be.equal(
                        0,
                    );

                    const tx = await prpGrantor
                        .connect(grantProcessor)
                        .redeemGrant(grantee.address, grantAmount);
                    rcp = await tx.wait();
                });

                xit('shall emit the PrpGrantUsed event w/ expected params', () => {
                    expect(rcp.logs);
                });

                it('shall decrease amount of "unused grant" for the grantee', async () => {
                    expect(
                        await prpGrantor.getUnusedGrantAmount(grantee.address),
                    ).to.be.equal(0);
                });

                it('shall increase the `totalGrantsRedeemed`', async () => {
                    expect(await prpGrantor.totalGrantsRedeemed()).to.be.equal(
                        grantAmount,
                    );
                });

                it('shall not increase the `totalGrantsIssued`', async () => {
                    expect(await prpGrantor.totalGrantsIssued()).to.be.equal(
                        grantAmount,
                    );
                });
            });
        });
    });

    describe('function burnGrant', () => {
        describe('', () => {
            before(() => {});
            xit('', async () => {});
        });
    });

    describe('function getGrantAmount', () => {
        describe('', () => {
            before(() => {});
            xit('', async () => {});
        });
    });

    describe('function getUnusedGrant', () => {
        describe('', () => {
            before(() => {});
            xit('', async () => {});
        });
    });
});
