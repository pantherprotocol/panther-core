import {ethers} from 'hardhat';
import {expect} from 'chai';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/dist/src/signers';
import {FakeContract, smock} from '@defi-wonderland/smock';
import {ERC20, RewardTreasury} from '../types/contracts';

describe('Reward treasury', () => {
    let rewardTreasury: RewardTreasury;
    let sampleToken: FakeContract<ERC20>;
    let rewardToken: FakeContract<ERC20>;
    let owner: SignerWithAddress;
    let user: SignerWithAddress;

    before(async () => {
        [owner, user] = await ethers.getSigners();

        sampleToken = await smock.fake('ERC20');
        rewardToken = await smock.fake('ERC20');

        const RewardTreasury = await ethers.getContractFactory(
            'RewardTreasury',
        );
        rewardTreasury = (await RewardTreasury.deploy(
            owner.address,
            rewardToken.address,
        )) as RewardTreasury;
    });

    it('should let owner approve an address to transfer reward token from treasury', async () => {
        await rewardTreasury.connect(owner).approveSpender(user.address, 100);
        expect(rewardToken.approve).to.have.been.calledWith(user.address, 100);
    });

    it('should revert if non-owner call approve()', async () => {
        await expect(
            rewardTreasury.connect(user).approveSpender(user.address, 100),
        ).to.be.revertedWith('ImmOwn: unauthorized');
    });

    it('should let admin to claim token', async () => {
        sampleToken.transfer.returns(true);

        await rewardTreasury
            .connect(owner)
            .claimErc20(sampleToken.address, user.address, 99);

        expect(sampleToken.transfer).to.have.been.calledWith(user.address, 99);
    });

    it('should revert for claiming reward token', async () => {
        await expect(
            rewardTreasury
                .connect(owner)
                .claimErc20(rewardToken.address, user.address, 99),
        ).to.be.revertedWith('RT: prohibited');
    });

    it('should revert if non-owner call claim()', async () => {
        await expect(
            rewardTreasury
                .connect(user)
                .claimErc20(sampleToken.address, user.address, 99),
        ).to.be.revertedWith('ImmOwn: unauthorized');
    });
});
