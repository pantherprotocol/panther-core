import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import {expect} from 'chai';
import {ethers} from 'hardhat';

import {PNftToken} from '../../types/contracts';

describe('PNFT Token', () => {
    let pNftToken: PNftToken;
    let owner: SignerWithAddress;
    let nonOwner: SignerWithAddress;

    const proxyRegistryAddress = '0xeeddeeddeeddeeddeeddeeddeeddeeddeeddeedd'; // random address just for testing
    const name = 'Panther NFT Token';
    const symbol = 'PNFT';

    before(async () => {
        [owner, nonOwner] = await ethers.getSigners();
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

        beforeEach(() => {
            recipient = ethers.Wallet.createRandom().address;
        });

        describe('Success', () => {
            it('should be executed by owner', async () => {
                await expect(pNftToken.connect(owner).grantOneToken(recipient))
                    .to.emit(pNftToken, 'Transfer')
                    .withArgs(ethers.constants.AddressZero, recipient, 1);

                expect(await pNftToken.ownerOf(1)).to.be.eq(recipient);
            });

            it('should increase the token id in the second execution', async () => {
                await pNftToken.grantOneToken(recipient);
                await pNftToken.grantOneToken(recipient);

                expect(await pNftToken.ownerOf(2)).to.be.eq(recipient);
            });
        });

        describe('Failure', () => {
            it('should throw if executed by non-owner', async () => {
                await expect(
                    pNftToken.connect(nonOwner).grantOneToken(recipient),
                ).to.be.revertedWith('Ownable: caller is not the owner');
            });
        });
    });
});
