import {ethers} from 'hardhat';
import {BigNumber, utils as u} from 'ethers';
import {expect} from 'chai';
import {FakeContract, smock} from '@defi-wonderland/smock';
import {
    StakesReporter,
    StakeRewardController,
    Staking,
} from '../../types/contracts';
import {parseDate} from '../../lib/units-shortcuts';

describe('Stakes Reporter', () => {
    let stakesReporter: StakesReporter;
    let stakeRewardController: FakeContract<StakeRewardController>;
    let staking: FakeContract<Staking>;

    const scale = u.parseUnits('1', 9);

    before(async () => {
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

    type Stake = [
        id: number,
        stakeType: string,
        stakedAt: number,
        lockedTill: number,
        claimedAt: number,
        amount: BigNumber,
        delegatee: string,
    ] & {stakedAt: number; claimedAt: number; amount: BigNumber};

    const createStake = (
        amount: BigNumber,
        _stakedAt: string,
        _claimedAt: string,
    ): Stake => {
        const stakedAt = parseDate(_stakedAt);
        const claimedAt = _claimedAt === '0' ? 0 : parseDate(_claimedAt);
        const lockedTill = stakedAt + 7 * 24 * 3600;
        const stake: any = [
            0, // stakeID
            '0x99999999', // stakeType
            stakedAt,
            lockedTill,
            claimedAt,
            amount, // amount
            ethers.constants.AddressZero, // delegatee
        ];
        stake.amount = amount;
        stake.stakedAt = stakedAt;
        stake.claimedAt = claimedAt;
        return stake as Stake;
    };

    const unclaimedStake = createStake(u.parseEther('1500'), '2022-03-01', '0');
    const claimedStake = createStake(
        u.parseEther('4000'),
        '2022-03-02',
        '2022-03-09',
    );
    const account1 = ethers.Wallet.createRandom().address;
    const account2 = ethers.Wallet.createRandom().address;

    const mockStakes = (account: string, stakeID: number, stake: Stake) => {
        staking.stakes
            .whenCalledWith(account, BigNumber.from(String(stakeID)))
            .returns(stake);
    };

    const mockGetScArptAt = (timestamp: number, amount: string) => {
        stakeRewardController.getScArptAt
            .whenCalledWith(timestamp)
            .returns(u.parseEther(amount));
    };

    const getUnclaimedRewards = (
        scArptFrom: string,
        scArptTill: string,
        amount: BigNumber,
    ) => {
        return u
            .parseEther(scArptTill)
            .sub(u.parseEther(scArptFrom))
            .mul(amount)
            .div(scale);
    };

    describe('getStakeInfo()', () => {
        it('should get info on claimed stake', async () => {
            const stakeID = 3;
            mockStakes(account1, stakeID, claimedStake);

            const [stake, unclaimedRewards] = await stakesReporter.getStakeInfo(
                account1,
                stakeID,
            );

            expect(stake.amount, 'amount').to.equal(claimedStake.amount);
            expect(unclaimedRewards, 'rewards').to.equal(0);
        });

        it('should get info on unclaimed stake', async () => {
            const stakeID = 5;
            mockStakes(account2, stakeID, unclaimedStake);
            mockGetScArptAt(unclaimedStake.stakedAt, '3');
            mockGetScArptAt(0, '10');

            const [stake, unclaimedRewards] = await stakesReporter.getStakeInfo(
                account2,
                stakeID,
            );

            expect(stake.amount, 'amount').to.equal(unclaimedStake.amount);

            // ARPT is 10 (current time) - 3 (stakedAt time)
            const expectedRewards = getUnclaimedRewards(
                '3',
                '10',
                unclaimedStake.amount,
            );
            expect(unclaimedRewards, 'rewards').to.equal(expectedRewards);
        });
    });

    describe('getStakesInfo()', () => {
        const mockAccountStakes = (account: string): void => {
            staking.accountStakes
                .whenCalledWith(account)
                .returns([claimedStake, unclaimedStake]);
        };

        it('should get info for multiple stakes', async () => {
            mockAccountStakes(account1);
            mockGetScArptAt(unclaimedStake.stakedAt, '10');
            mockGetScArptAt(0, '15');

            const [stakes, unclaimedRewards] =
                await stakesReporter.getStakesInfo(account1);

            const expectedRewards = getUnclaimedRewards(
                '10',
                '15',
                unclaimedStake.amount,
            );
            expect(stakes[0].amount, 'amount 0').to.equal(claimedStake.amount);
            expect(stakes[1].amount, 'amount 1').to.equal(
                unclaimedStake.amount,
            );
            expect(unclaimedRewards[0], 'rewards 0').to.equal(0);
            expect(unclaimedRewards[1], 'rewards 1').to.equal(expectedRewards);
            expect(unclaimedRewards.length, 'rewards length').to.equal(2);
        });
    });
});
