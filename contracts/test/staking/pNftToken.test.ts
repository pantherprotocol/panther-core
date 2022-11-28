import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import {expect} from 'chai';
import {ethers} from 'hardhat';

import {PNftToken} from '../../types/contracts';

describe('PNFT Token', () => {
    let pNftToken: PNftToken;
    let owner: SignerWithAddress;
    let minter: SignerWithAddress;
    let nonMinter: SignerWithAddress;

    const proxyRegistryAddress = '0xeeddeeddeeddeeddeeddeeddeeddeeddeeddeedd'; // random address just for testing
    const name = 'Panther NFT Token';
    const symbol = 'PNFT';

    before(async () => {
        [owner, minter, nonMinter] = await ethers.getSigners();
    });

    beforeEach(async () => {
        const PNftToken = await ethers.getContractFactory('PNftToken');

        pNftToken = (await PNftToken.deploy(
            proxyRegistryAddress,
            name,
            symbol,
        )) as PNftToken;
    });

    describe('#grantOneToken', () => {
        let recipient: string;

        beforeEach(async () => {
            recipient = ethers.Wallet.createRandom().address;
            await pNftToken.connect(owner).setMinter(minter.address);
        });

        describe('Success', () => {
            it('should be executed by minter', async () => {
                await expect(pNftToken.connect(minter).grantOneToken(recipient))
                    .to.emit(pNftToken, 'Transfer')
                    .withArgs(ethers.constants.AddressZero, recipient, 1);

                expect(await pNftToken.ownerOf(1)).to.be.eq(recipient);
            });

            it('should increase the token id in the second execution', async () => {
                await pNftToken.connect(minter).grantOneToken(recipient);
                await pNftToken.connect(minter).grantOneToken(recipient);

                expect(await pNftToken.ownerOf(2)).to.be.eq(recipient);
            });
        });

        describe('Failure', () => {
            it('should throw if executed by non-minter', async () => {
                await expect(
                    pNftToken.connect(nonMinter).grantOneToken(recipient),
                ).to.be.revertedWith('Only minter');
            });
        });
    });

    describe('#setContractURI', () => {
        let baseContractUri: string;

        beforeEach(async () => {
            baseContractUri = 'Ranome Contract URI';
        });

        describe('Success', () => {
            it('should be executed by owner', async () => {
                await expect(
                    pNftToken.connect(owner).setContractURI(baseContractUri),
                )
                    .to.emit(pNftToken, 'ContractUriUpdated')
                    .withArgs(baseContractUri);
            });
        });

        describe('Failure', () => {
            it('should throw if executed by non-owner', async () => {
                await expect(
                    pNftToken.connect(minter).setBaseTokenURI(baseContractUri),
                ).to.be.revertedWith('Ownable: caller is not the owner');
            });

            it('should throw if executed twice', async () => {
                await pNftToken.connect(owner).setContractURI(baseContractUri);

                await expect(
                    pNftToken.connect(owner).setContractURI(baseContractUri),
                ).to.be.revertedWith('Contract URI is defined');
            });
        });
    });

    describe('#setBaseTokenURI', () => {
        let baseTokenUri: string;

        beforeEach(async () => {
            baseTokenUri = 'Ranome Token URI';
        });

        describe('Success', () => {
            it('should be executed by owner', async () => {
                await expect(
                    pNftToken.connect(owner).setContractURI(baseTokenUri),
                )
                    .to.emit(pNftToken, 'ContractUriUpdated')
                    .withArgs(baseTokenUri);
            });
        });

        describe('Failure', () => {
            it('should throw if executed by non-owner', async () => {
                await expect(
                    pNftToken.connect(minter).setBaseTokenURI(baseTokenUri),
                ).to.be.revertedWith('Ownable: caller is not the owner');
            });

            it('should throw if executed twice', async () => {
                await pNftToken.connect(owner).setBaseTokenURI(baseTokenUri);

                await expect(
                    pNftToken.connect(owner).setBaseTokenURI(baseTokenUri),
                ).to.be.revertedWith('Base URI is defined');
            });
        });
    });
});
