import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/dist/src/signers';
import {ethers, network} from 'hardhat';
import {expect} from 'chai';
import {BigNumber} from 'ethers';
import {MockClaimable, TokenMock} from '../types/contracts';

describe('Claimable', () => {
    let claimable: MockClaimable;
    let token: TokenMock;
    let user: SignerWithAddress;
    let evmId: any;

    before(async () => {
        evmId = await network.provider.send('evm_snapshot');

        [user] = await ethers.getSigners();

        const Token = await ethers.getContractFactory('TokenMock');
        token = (await Token.connect(user).deploy()) as TokenMock;

        const Claimable = await ethers.getContractFactory('MockClaimable');
        claimable = (await Claimable.deploy()) as MockClaimable;

        // send some tokens to the Claimable contract
        const claimableBalance = BigNumber.from(10).pow(24);
        await token.connect(user).transfer(claimable.address, claimableBalance);
    });

    after(async function () {
        await network.provider.send('evm_revert', [evmId]);
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
