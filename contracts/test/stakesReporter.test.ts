import {ethers} from 'hardhat';
import {BigNumber} from 'ethers';
import {expect} from 'chai';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/dist/src/signers';
import {FakeContract, smock} from '@defi-wonderland/smock';
import {
    StakesReporter,
    StakeRewardController,
    Staking,
} from '../types/contracts';

describe('Stakes Reporter', () => {
    let stakesReporter: StakesReporter;
    let stakeRewardController: FakeContract<StakeRewardController>;
    let staking: FakeContract<Staking>;
    let staker: SignerWithAddress;

    const e9 = '000000000';
    const e18 = '000000000000000000';

    const scale = BigNumber.from('1' + e9);
    const scArptFrom = BigNumber.from('987654321' + e18);
    const scArptTill = BigNumber.from('123456789' + e18);

    before(async () => {
        [staker] = await ethers.getSigners();

        stakeRewardController = await smock.fake('StakeRewardController');
        staking = await smock.fake('Staking');

        const StakesReporter = await ethers.getContractFactory(
            'StakesReporter',
        );
        stakesReporter = (await StakesReporter.deploy(
            staking.address,
            stakeRewardController.address,
        )) as StakesReporter;
    });

    const getUnclaimedRewards = (amount: BigNumber) => {
        return scArptFrom.sub(scArptTill).mul(amount).div(scale);
    };

    const mockStakes = (
        stakedAmount: BigNumber,
        stakedAt: number,
        claimedAt: number,
    ) => {
        staking.stakes.returns([
            0, // id
            '0x99999999', // stakeType
            stakedAt, // stakedAt
            0, // lockedTill
            claimedAt, // claimedAt
            stakedAmount, // amount
            ethers.constants.AddressZero, // delegatee
        ]);
    };
    const mockAccountStakes = (stakedAmount: BigNumber, stakedAt: number) => {
        // Note: First stake has not been claimed yet but the second one has
        staking.accountStakes.returns([
            [
                0, // id
                '0x99999999', // stakeType
                stakedAt, // stakedAt
                0, // lockedTill
                0, // claimedAt
                stakedAmount, // amount
                ethers.constants.AddressZero, // delegatee
            ],
            [
                0, // id
                '0x99999999', // stakeType
                stakedAt, // stakedAt
                0, // lockedTill
                99, // claimedAt
                stakedAmount, // amount
                ethers.constants.AddressZero, // delegatee
            ],
        ]);
    };
    const mockGetScArptAt = (stakedAt: number) => {
        stakeRewardController.getScArptAt.whenCalledWith(0).returns(scArptFrom);
        stakeRewardController.getScArptAt
            .whenCalledWith(stakedAt)
            .returns(scArptTill);
    };

    it('should get stake info which has not been claimed', async () => {
        const stakedAmount = BigNumber.from('1000' + e18);
        const stakedAt = 99;
        const claimedAt = 0;

        mockStakes(stakedAmount, stakedAt, claimedAt);
        mockGetScArptAt(stakedAt);

        const info = await stakesReporter.getStakeInfo(staker.address, 0);

        const unclaimedRewards = getUnclaimedRewards(stakedAmount);

        expect(info.stake.amount).to.equal(stakedAmount);
        expect(info.unclaimedRewards).to.equal(unclaimedRewards);
    });

    it('should get stake info which has been claimed', async () => {
        const stakedAmount = BigNumber.from('1000' + e18);
        const stakedAt = 99;
        const claimedAt = 1;

        mockStakes(stakedAmount, stakedAt, claimedAt);
        mockGetScArptAt(stakedAt);

        const info = await stakesReporter.getStakeInfo(staker.address, 0);

        expect(info.stake.amount).to.equal(stakedAmount);
        expect(info.unclaimedRewards).to.equal(0);
    });

    it('should get stakes info', async () => {
        const stakedAmount = BigNumber.from('1000' + e18);
        const stakedAt = 99;

        // Note: First stake has not been claimed yet but the second one has
        mockAccountStakes(stakedAmount, stakedAt);
        mockGetScArptAt(stakedAt);

        const info = await stakesReporter.getStakesInfo(staker.address);

        const unclaimedRewards = getUnclaimedRewards(stakedAmount);

        expect(info.stakes[0].amount).to.equal(stakedAmount);
        expect(info.stakes[1].amount).to.equal(stakedAmount);
        expect(info.unclaimedRewards[0]).to.equal(unclaimedRewards);
        expect(info.unclaimedRewards.length).to.equal(1);
    });
});
