import {ethers} from 'hardhat';
import {BigNumber, ContractTransaction} from 'ethers';
import {FakeContract, smock} from '@defi-wonderland/smock';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import {
    RewardPool,
    IErc20Min,
    IRewardAdviser,
    RewardMaster as RewardMasterContract,
} from '../../types/contracts';

export class RewardMasterFixture {
    public contracts: RewardMasterFixtureContracts =
        {} as RewardMasterFixtureContracts;
    public signers: Signers = {} as Signers;
    public action = ethers.utils.id('AN_ACTION').slice(0, 10); // bytes4
    public message = ethers.utils.id('AN_ENCODED_MESSAGE');
    public startBlock = 0;
    public amountToShareScaledFactor = BigNumber.from(10);
    public shareScale = BigNumber.from(1e3);

    async initFixture() {
        const provider = ethers.provider;

        [
            this.signers.owner,
            this.signers.oracle,
            this.signers.user_1,
            this.signers.user_2,
            this.signers.user_3,
            this.signers.user_4,
        ] = await ethers.getSigners();

        this.contracts.rewardPool = await smock.fake('RewardPool');
        this.contracts.rewardToken = await smock.fake('IErc20Min');
        this.contracts.rewardAdviser = await smock.fake('IRewardAdviser');

        const RewardMaster = await ethers.getContractFactory('RewardMaster');

        this.contracts.rewardMaster = (await RewardMaster.deploy(
            this.contracts.rewardToken.address,
            this.contracts.rewardPool.address,
            this.signers.owner.address,
        )) as RewardMasterContract;

        this.startBlock = (await provider.getBlock('latest')).number;
    }

    getAdvice(
        address: string,
        shares: BigNumber,
    ): {stakeAdvice: Advice; unstakeAdvice: Advice} {
        const stakeAdvice: Advice = {
            createSharesFor: address,
            sharesToCreate: shares,
            redeemSharesFrom: ethers.constants.AddressZero,
            sharesToRedeem: BigNumber.from(0),
            sendRewardTo: ethers.constants.AddressZero,
        };

        const unstakeAdvice: Advice = {
            createSharesFor: ethers.constants.AddressZero,
            sharesToCreate: BigNumber.from(0),
            redeemSharesFrom: address,
            sharesToRedeem: shares,
            sendRewardTo: address,
        };

        return {stakeAdvice, unstakeAdvice};
    }

    addRewardAdviser(from = this.signers.owner): Promise<ContractTransaction> {
        return this.contracts.rewardMaster
            .connect(from)
            .addRewardAdviser(
                this.signers.oracle.address,
                this.action,
                this.contracts.rewardAdviser.address,
            );
    }

    onAction(advice: Advice): Promise<ContractTransaction> {
        this.contracts.rewardAdviser.getRewardAdvice.returns(advice);

        return this.contracts.rewardMaster
            .connect(this.signers.oracle)
            .onAction(this.action, this.message);
    }

    convertAmountToShares(amount: BigNumber): BigNumber {
        return amount.mul(this.amountToShareScaledFactor).div(this.shareScale);
    }

    async createSharesForSigners(
        entitledShares: BigNumber,
        vestedRewards: BigNumber,
    ): Promise<void> {
        const signers = Object.values(this.signers);

        for (let i = 0; i < signers.length; i++) {
            const {stakeAdvice} = this.getAdvice(
                signers[i].address,
                entitledShares,
            );

            this.contracts.rewardToken.balanceOf.returns(vestedRewards.mul(i));

            await this.onAction(stakeAdvice);
        }
    }
}

type Advice = {
    createSharesFor: string;
    sharesToCreate: BigNumber;
    redeemSharesFrom: string;
    sharesToRedeem: BigNumber;
    sendRewardTo: string;
};

type Signers = {
    [key: string]: SignerWithAddress;
};

type RewardMasterFixtureContracts = {
    rewardPool: FakeContract<RewardPool>;
    rewardToken: FakeContract<IErc20Min>;
    rewardAdviser: FakeContract<IRewardAdviser>;
    rewardMaster: RewardMasterContract;
};
