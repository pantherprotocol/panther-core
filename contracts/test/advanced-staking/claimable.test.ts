import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/dist/src/signers';
import {ethers} from 'hardhat';
import {expect} from 'chai';
import {BigNumber} from 'ethers';
import {MockClaimable, TokenMock} from '../../types/contracts';

describe('Claimable', () => {
    let claimable: MockClaimable;
    let token: TokenMock;
    let user: SignerWithAddress;

    before(async () => {
        [user] = await ethers.getSigners();

        const Token = await ethers.getContractFactory('TokenMock');
        token = (await Token.connect(user).deploy()) as TokenMock;

        const Claimable = await ethers.getContractFactory('MockClaimable');
        claimable = (await Claimable.deploy()) as MockClaimable;

        // send some tokens to the Claimable contract
        const claimableBalance = BigNumber.from(10).pow(24);
        await token.connect(user).transfer(claimable.address, claimableBalance);
    });

    it('should transfer erc20 from contract to receiver', async () => {
        const receiver = ethers.Wallet.createRandom().address;
        await claimable.internalClaimErc20(token.address, receiver, '1000');

        expect(await token.balanceOf(receiver)).to.eq('1000');
    });

    it('should revert if the transfer is not successful', async () => {
        await expect(
            claimable.internalClaimErc20(
                token.address,
                user.address,
                ethers.constants.MaxUint256,
            ),
        ).revertedWith('claimErc20: TRANSFER_FAILED');
    });
});
