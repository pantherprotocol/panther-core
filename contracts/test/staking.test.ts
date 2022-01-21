import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/dist/src/signers';
import {smock, FakeContract} from '@defi-wonderland/smock';
import {BaseContract, Contract, utils} from 'ethers';
import chai from 'chai';
import {ethers} from 'hardhat';

import {increaseTime} from './helpers/hardhatHelpers';
import {hash4bytes, classicActionHash, CLASSIC, STAKE} from '../lib/hash';

const expect = chai.expect;

chai.should(); // if you like should syntax
chai.use(smock.matchers);

const stakeType = hash4bytes(CLASSIC);

describe('Staking Contract', async () => {
    let provider: any;
    let rewardPool: FakeContract<BaseContract>;
    let rewardToken: Contract;
    let rewardAdviser: FakeContract<BaseContract>;
    let stakingToken: Contract;
    let ctRewardMaster: Contract;
    let ctStaking: Contract;
    let startBlock: number;
    let owner: SignerWithAddress,
        alice: SignerWithAddress,
        bob: SignerWithAddress,
        wallet1: SignerWithAddress,
        wallet2: SignerWithAddress,
        wallet3: SignerWithAddress;

    before(async function () {
        [owner, alice, bob, wallet1, wallet2, wallet3] =
            await ethers.getSigners();

        provider = ethers.provider;

        rewardPool = await smock.fake('RewardPool');
        rewardAdviser = await smock.fake('IRewardAdviser');

        const TokenMock = await ethers.getContractFactory('TokenMock');

        rewardToken = await TokenMock.deploy();
        stakingToken = await TokenMock.deploy();

        // Deploy & Set configuration for RewardMaster contract
        const RewardMaster = await ethers.getContractFactory('RewardMaster');
        const actionType = classicActionHash(STAKE);
        ctRewardMaster = await RewardMaster.deploy(
            rewardToken.address,
            rewardPool.address,
            owner.address,
        );

        // Deploy Staking contrac
        const Staking = await ethers.getContractFactory('Staking');
        ctStaking = await Staking.deploy(
            stakingToken.address,
            ctRewardMaster.address,
            owner.address,
        );

        startBlock = (await provider.getBlock('latest')).number;

        //Add RewardAdvisor
        await ctRewardMaster.addRewardAdviser(
            ctStaking.address,
            actionType,
            rewardAdviser.address,
        );

        // Add Terms
        const terms = {
            isEnabled: true,
            isRewarded: true,
            minAmountScaled: utils.hexZeroPad('0x00', 32),
            maxAmountScaled: utils.hexZeroPad('0x00', 32),
            allowedSince: utils.hexZeroPad('0x00', 32),
            allowedTill: utils.hexZeroPad('0x00', 32),
            lockedTill: utils.hexZeroPad('0x00', 32),
            exactLockPeriod: utils.hexZeroPad('0x00', 32),
            minLockPeriod: utils.hexZeroPad('0x1E', 32),
        };

        // Add Terms
        const tx = await ctStaking.addTerms(stakeType, terms);
        await tx.wait();

        // Transfer staking tokens to users' wallets
        await stakingToken.transfer(alice.address, 10000);
        await stakingToken.transfer(bob.address, 10000);
        await stakingToken.transfer(wallet1.address, 10000);
        await stakingToken.transfer(wallet2.address, 10000);
        await stakingToken.transfer(wallet3.address, 10000);
    });

    beforeEach(async () => {
        const rewardPoolFactory = await smock.mock('RewardPool');
        const vestingPoolFactory = await smock.fake('IVestingPools');
        rewardPool = await rewardPoolFactory.deploy(
            vestingPoolFactory.address,
            owner.address,
        );
    });

    describe('initial parameters checking', function () {
        it('stakingToken should be set properly', async () => {
            await expect(stakingToken.address).to.equal(
                await ctStaking.TOKEN(),
            );
        });

        it('rewardMaster should be set properly', async () => {
            await expect(ctRewardMaster.address).to.equal(
                await ctStaking.REWARD_MASTER(),
            );
        });

        it('startBlock should be set properly', async () => {
            await expect(startBlock).to.equal(await ctStaking.START_BLOCK());
        });
    });

    describe('stake()', function () {
        let stakeInfo: any;
        let powerInfo: any;
        before(async function () {
            await stakingToken.approve(ctStaking.address, 1000000);
            await ctStaking.stake(100, stakeType, 0x0);

            stakeInfo = await ctStaking.stakes(owner.address, 0);
            powerInfo = await ctStaking.power(owner.address);
        });

        it('reverts when stakeType is invalid', async () => {
            await expect(
                ctStaking.stake(0, '0x00000001', 0x0),
            ).to.be.revertedWith('Staking: Terms unknown or disabled');
        });

        it('amount allocation should be equal', async () => {
            await expect(stakeInfo.amount).to.eq(100);
        });

        it('stakeType should be equal', async () => {
            await expect(stakeInfo.stakeType).to.eq(stakeType);
        });

        it('power should be equal', async () => {
            await expect(powerInfo.own).to.eq(100);
        });
    });

    describe('unstake()', function () {
        before(async function () {
            await increaseTime(3600);
            await ctStaking.unstake(0, 0x0, true);
        });

        it('amount allocation should be zero', async () => {
            await expect(
                (
                    await ctStaking.stakes(owner.address, 0)
                ).amount,
            ).to.eq(100);
        });

        it('power should be equal', async () => {
            await expect((await ctStaking.power(owner.address)).own).to.eq(0);
        });
    });

    describe('delegate()', function () {
        before(async function () {
            // stake 1
            await ctStaking.stake(100, stakeType, 0x0);
            // stake 2
            await ctStaking.stake(1000, stakeType, 0x0);
            // stake 3
            await ctStaking.stake(10000, stakeType, 0x0);
        });

        it('reverts when no stake was claimed', async () => {
            await expect(
                ctStaking.delegate(0, wallet2.address),
            ).to.be.revertedWith('Staking: Stake claimed');
        });

        it('reverts when it is delegated to global account', async () => {
            await expect(
                ctStaking.delegate(
                    0,
                    '0x0000000000000000000000000000000000000000',
                ),
            ).to.be.revertedWith("Staking: Can't delegate to GLOBAL_ACCOUNT");
        });

        it('delegation to empty account', async () => {
            await ctStaking.delegate(1, alice.address);
            await expect(
                (
                    await ctStaking.power(alice.address)
                ).delegated,
            ).to.eq(100);
        });

        it('un-delegation to self', async () => {
            await ctStaking.delegate(1, owner.address);
            await expect((await ctStaking.power(owner.address)).own).to.eq(
                11100,
            );
            await expect(
                (
                    await ctStaking.power(alice.address)
                ).delegated,
            ).to.eq(0);
        });

        it('re-delegation to another account', async () => {
            await ctStaking.delegate(2, alice.address);
            await expect(
                (
                    await ctStaking.power(alice.address)
                ).delegated,
            ).to.eq(1000);

            await ctStaking.delegate(2, bob.address);
            await expect(
                (
                    await ctStaking.power(alice.address)
                ).delegated,
            ).to.eq(0);
            await expect((await ctStaking.power(bob.address)).delegated).to.eq(
                1000,
            );
        });
    });

    describe('undelegate()', function () {
        before(async function () {
            // stake 4
            await ctStaking.stake(200, stakeType, 0x0);
        });

        it('undelegate after delegation', async () => {
            await ctStaking.delegate(4, wallet1.address);
            await expect(
                (
                    await ctStaking.power(wallet1.address)
                ).delegated,
            ).to.eq(200);

            await ctStaking.undelegate(4);
            await expect(
                (
                    await ctStaking.power(wallet1.address)
                ).delegated,
            ).to.eq(0);
        });
    });

    describe('Snapshot', function () {
        let snapshotBlockNum: number;
        let snapshot1: any;
        let snapshot2: any;
        let snapshot3: any;
        let snapshot4: any;
        let snapshot5: any;

        before(async function () {
            await stakingToken
                .connect(wallet3)
                .approve(ctStaking.address, 10000);
            // stake 0
            snapshotBlockNum = (await provider.getBlock('latest')).number;
            await ctStaking.connect(wallet3).stake(100, stakeType, 0x0);
            // stake 1
            await ctStaking.connect(wallet3).stake(200, stakeType, 0x0);
            // stake 2
            await ctStaking.connect(wallet3).stake(300, stakeType, 0x0);
            // stake 3
            await ctStaking.connect(wallet3).stake(400, stakeType, 0x0);
            // stake 4
            await ctStaking.connect(wallet3).stake(500, stakeType, 0x0);
            await increaseTime(3600);
            await expect(await ctStaking.snapshotLength(wallet3.address)).to.eq(
                5,
            );
            snapshot1 = await ctStaking.snapshot(wallet3.address, 0);
            snapshot2 = await ctStaking.snapshot(wallet3.address, 1);
            snapshot3 = await ctStaking.snapshot(wallet3.address, 2);
            snapshot4 = await ctStaking.snapshot(wallet3.address, 3);
            snapshot5 = await ctStaking.snapshot(wallet3.address, 4);
        });

        it('snapshot1 should have correct params', async () => {
            await expect(snapshot1.beforeBlock).to.eq(snapshotBlockNum + 1);
            await expect(snapshot1.ownPower).to.eq(0);
        });

        it('snapshot2 should have correct params', async () => {
            await expect(snapshot2.beforeBlock).to.eq(snapshotBlockNum + 2);
            await expect(snapshot2.ownPower).to.eq(100);
        });

        it('snapshot3 should have correct params', async () => {
            await expect(snapshot3.beforeBlock).to.eq(snapshotBlockNum + 3);
            await expect(snapshot3.ownPower).to.eq(300);
        });

        it('snapshot4 should have correct params', async () => {
            await expect(snapshot4.beforeBlock).to.eq(snapshotBlockNum + 4);
            await expect(snapshot4.ownPower).to.eq(600);
        });

        it('snapshot5 should have correct params', async () => {
            await expect(snapshot5.beforeBlock).to.eq(snapshotBlockNum + 5);
            await expect(snapshot5.ownPower).to.eq(1000);
        });

        it('stakesNum() should return correct lengh', async () => {
            await expect(await ctStaking.stakesNum(wallet3.address)).to.eq(5);
        });

        it('latestSnapshotBlock() should return correct block number', async () => {
            await expect(
                await ctStaking.latestSnapshotBlock(wallet3.address),
            ).to.eq(snapshotBlockNum + 5);
        });

        it('latestGlobalsSnapshotBlock() should return correct block number', async () => {
            await expect(await ctStaking.latestGlobalsSnapshotBlock()).to.eq(
                snapshotBlockNum + 5,
            );
        });

        it('latestGlobalsSnapshotBlock() should return correct block number', async () => {
            await expect(await ctStaking.snapshotLength(wallet1.address)).to.eq(
                1,
            );
            await expect(await ctStaking.snapshotLength(wallet2.address)).to.eq(
                0,
            );
            await expect(await ctStaking.snapshotLength(wallet3.address)).to.eq(
                5,
            );
            await expect(await ctStaking.snapshotLength(alice.address)).to.eq(
                3,
            );
            await expect(await ctStaking.snapshotLength(bob.address)).to.eq(1);
        });
    });

    describe('addTerms()', function () {
        const term1 = {
            isEnabled: true,
            isRewarded: true,
            minAmountScaled: utils.hexZeroPad('0x00', 32),
            maxAmountScaled: utils.hexZeroPad('0x00', 32),
            allowedSince: utils.hexZeroPad('0x00', 32),
            allowedTill: utils.hexZeroPad('0x00', 32),
            lockedTill: utils.hexZeroPad('0x00', 32),
            exactLockPeriod: utils.hexZeroPad('0x00', 32),
            minLockPeriod: utils.hexZeroPad('0x1E', 32),
        };
        const stakeType1 = '0x4ab0941b';

        it("reverts if it's called by not owner", async () => {
            await expect(
                ctStaking.connect(wallet1).addTerms(stakeType1, term1),
            ).to.be.revertedWith('ImmOwn: unauthorized');
        });

        it("reverts if it's trying to add existing terms", async () => {
            await expect(
                ctStaking.addTerms(stakeType, term1),
            ).to.be.revertedWith('Staking:E1');
        });

        it('reverts if isEnabled is false', async () => {
            await expect(
                ctStaking.addTerms(stakeType1, {...term1, isEnabled: false}),
            ).to.be.revertedWith('Staking:E2');
        });

        it('reverts if allowedSince is less than current timestamp', async () => {
            await expect(
                ctStaking.addTerms(stakeType1, {
                    ...term1,
                    allowedSince: utils.hexZeroPad('0x01', 32),
                }),
            ).to.be.revertedWith('Staking:E3');
        });

        it('reverts if allowedTill is less than current timestamp', async () => {
            await expect(
                ctStaking.addTerms(stakeType1, {
                    ...term1,
                    allowedTill: utils.hexZeroPad('0x01', 32),
                }),
            ).to.be.revertedWith('Staking:E4');
        });

        it('reverts if maxAmountScaled is less than minAmountScaled', async () => {
            await expect(
                ctStaking.addTerms(stakeType1, {
                    ...term1,
                    maxAmountScaled: utils.hexZeroPad('0x11', 32),
                    minAmountScaled: utils.hexZeroPad('0x22', 32),
                }),
            ).to.be.revertedWith('Staking:E5');
        });

        it('reverts if two lock time parameters are non-zero', async () => {
            await expect(
                ctStaking.addTerms(stakeType1, {
                    ...term1,
                    minLockPeriod: utils.hexZeroPad('0x00', 32),
                    lockedTill: utils.hexZeroPad('0x1E', 32),
                    exactLockPeriod: utils.hexZeroPad('0x1E', 32),
                }),
            ).to.be.revertedWith('Staking:E6');

            await expect(
                ctStaking.addTerms(stakeType1, {
                    ...term1,
                    minLockPeriod: utils.hexZeroPad('0x00', 32),
                    lockedTill: utils.hexZeroPad('0x1E', 32),
                    exactLockPeriod: utils.hexZeroPad('0x00', 32),
                }),
            ).to.be.revertedWith('Staking:E7');

            await expect(
                ctStaking.addTerms(stakeType1, {
                    ...term1,
                    minLockPeriod: utils.hexZeroPad('0x1E', 32),
                    lockedTill: utils.hexZeroPad('0x00', 32),
                    exactLockPeriod: utils.hexZeroPad('0x1E', 32),
                }),
            ).to.be.revertedWith('Staking:E8');
        });

        it('terms should be added properly', async () => {
            await ctStaking.addTerms(stakeType1, term1);
            const termRes = await ctStaking.terms(stakeType1);
            await expect(termRes.isEnabled).to.eq(true);
            await expect(termRes.isRewarded).to.eq(true);
            await expect(termRes.minAmountScaled).to.eq(0);
            await expect(termRes.maxAmountScaled).to.eq(0);
            await expect(termRes.allowedSince).to.eq(0);
            await expect(termRes.allowedTill).to.eq(0);
            await expect(termRes.lockedTill).to.eq(0);
            await expect(termRes.exactLockPeriod).to.eq(0);
            await expect(termRes.minLockPeriod).to.eq(30);
        });
    });

    describe('disableTerms()', function () {
        const stakeType1 = '0x4ab0941b';

        it("reverts if it's called by not owner", async () => {
            await expect(
                ctStaking.connect(wallet1).disableTerms(stakeType1),
            ).to.be.revertedWith('ImmOwn: unauthorized');
        });

        it('reverts if it try to disable non-existing terms', async () => {
            await expect(
                ctStaking.disableTerms('0x4ab0941c'),
            ).to.be.revertedWith('Staking:E9');
        });

        it('disable terms should set isEnabled to false', async () => {
            await ctStaking.disableTerms(stakeType1);
            const terms = await ctStaking.terms(stakeType1);
            expect(terms.isEnabled).to.eq(false);
        });

        it('reverts if it try to disable disabled term', async () => {
            await expect(ctStaking.disableTerms(stakeType1)).to.be.revertedWith(
                'Staking:EA',
            );
        });
    });
});
