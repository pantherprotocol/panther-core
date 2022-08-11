import {Provider} from '@ethersproject/providers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/dist/src/signers';
import {smock, FakeContract} from '@defi-wonderland/smock';
import {BaseContract, BigNumber, utils} from 'ethers';
import chai from 'chai';
import {ethers} from 'hardhat';
import {Staking, TokenMock, RewardMaster} from '../../types/contracts';
import {increaseTime} from '../../lib/hardhat';
import {hash4bytes, classicActionHash, CLASSIC, STAKE} from '../../lib/hash';
import {getBlockTimestamp} from '../../lib/provider';
import {fromRpcSig} from 'ethereumjs-util';
import {TypedDataDomain} from '@ethersproject/abstract-signer';

const expect = chai.expect;

const stakeType = hash4bytes(CLASSIC);

function toBytes32(n: number | string | bigint) {
    return ethers.utils.hexZeroPad(
        ethers.utils.hexlify(ethers.BigNumber.from(n)),
        32,
    );
}

describe('Staking Contract', async () => {
    let provider: Provider;
    let rewardPool: FakeContract<BaseContract>;
    let rewardAdviser: FakeContract<BaseContract>;
    let rewardToken: TokenMock;
    let stakingToken: TokenMock;
    let ctRewardMaster: RewardMaster;
    let ctStaking: Staking;
    let startBlock: number;
    let owner: SignerWithAddress,
        alice: SignerWithAddress,
        bob: SignerWithAddress,
        wallet1: SignerWithAddress,
        wallet2: SignerWithAddress,
        wallet3: SignerWithAddress,
        wallet4: SignerWithAddress;

    const validTerms = {
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

    before(async function () {
        const users = await ethers.getSigners();

        [owner, alice, bob, wallet1, wallet2, wallet3, wallet4] = users;

        provider = ethers.provider;

        rewardPool = await smock.fake('RewardPool');
        rewardAdviser = await smock.fake('IRewardAdviser');

        const TokenMock = await ethers.getContractFactory('TokenMock');

        rewardToken = (await TokenMock.deploy()) as TokenMock;
        stakingToken = (await TokenMock.deploy()) as TokenMock;

        // Deploy & Set configuration for RewardMaster contract
        const RewardMaster = await ethers.getContractFactory('RewardMaster');
        const actionType = classicActionHash(STAKE);
        ctRewardMaster = (await RewardMaster.deploy(
            rewardToken.address,
            rewardPool.address,
            owner.address,
        )) as RewardMaster;

        // Deploy Staking contract
        const Staking = await ethers.getContractFactory('Staking');
        ctStaking = (await Staking.deploy(
            stakingToken.address,
            ctRewardMaster.address,
            owner.address,
        )) as Staking;

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

        const userBalance = BigNumber.from(10000);
        for (const user of users) {
            await stakingToken.transfer(user.address, userBalance);
            await stakingToken
                .connect(user)
                .approve(ctStaking.address, ethers.constants.MaxInt256);
        }
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
        it('ensures stakingToken has been set properly', async () => {
            expect(stakingToken.address).to.equal(await ctStaking.TOKEN());
        });

        it('ensures rewardMaster has been set properly', async () => {
            expect(ctRewardMaster.address).to.equal(
                await ctStaking.REWARD_MASTER(),
            );
        });

        it('ensures startBlock has been set properly', async () => {
            expect(startBlock).to.equal(await ctStaking.START_BLOCK());
        });
    });

    describe('stake()', function () {
        let stakeInfo: any;
        let powerInfo: any;
        before(async function () {
            await ctStaking.stake(100, stakeType, '0x00');

            stakeInfo = await ctStaking.stakes(owner.address, 0);
            powerInfo = await ctStaking.power(owner.address);
        });

        it('reverts when stakeType is invalid', async () => {
            await expect(
                ctStaking.stake(0, '0x00000001', '0x00'),
            ).to.be.revertedWith('Staking: Terms unknown or disabled');
        });

        it('amount allocation should be equal', async () => {
            await expect(stakeInfo.amount).to.eq(100);
        });

        it('should check the stakeType', async () => {
            expect(stakeInfo.stakeType).to.eq(stakeType);
        });

        it('should check the power of staker', async () => {
            expect(powerInfo.own).to.eq(100);
        });

        it('should let user stake with permit', async () => {
            const amount = BigNumber.from(100);
            const deadline = ethers.constants.MaxUint256;
            const nonce = '0';
            const spender = ctStaking.address;
            const name = await stakingToken.name();
            const version = '1';
            const {chainId} = await provider.getNetwork();
            const verifyingContract = stakingToken.address;

            const types = {
                Permit: [
                    {name: 'owner', type: 'address'},
                    {name: 'spender', type: 'address'},
                    {name: 'value', type: 'uint256'},
                    {name: 'nonce', type: 'uint256'},
                    {name: 'deadline', type: 'uint256'},
                ],
            };

            const value = {
                owner: wallet4.address,
                spender,
                value: amount,
                nonce,
                deadline,
            };

            const domain: TypedDataDomain = {
                name,
                version,
                chainId,
                verifyingContract,
            };

            const signature = await wallet4._signTypedData(
                domain,
                types,
                value,
            );

            const {v, r, s} = fromRpcSig(signature);

            await ctStaking
                .connect(wallet4)
                .permitAndStake(
                    wallet4.address,
                    amount,
                    deadline,
                    v,
                    r,
                    s,
                    stakeType,
                    '0x00',
                );

            const stakes = await ctStaking.accountStakes(owner.address);
            const {delegatee, amount: stakedAmount, claimedAt, id} = stakes[0];

            expect(stakes.length).to.eq(1);
            expect(delegatee).to.eq(ethers.constants.AddressZero);
            expect(stakedAmount).to.eq(amount);
            expect(claimedAt).to.eq(0);
            expect(id).to.eq(0);
        });
    });

    describe('unstake()', function () {
        before(async function () {
            await increaseTime(3600);
            await ctStaking.unstake(0, '0x00', true);
        });

        it('ensures amount allocation is zero', async () => {
            expect((await ctStaking.stakes(owner.address, 0)).amount).to.eq(
                100,
            );
        });

        it('ensures power is 0', async () => {
            expect((await ctStaking.power(owner.address)).own).to.eq(0);
        });

        it('it should remove the votes of delegatee after unstake', async () => {
            // stake with wallet1 and delegate its power to wallet2
            await ctStaking.connect(wallet1).stake(100, stakeType, '0x00');
            await ctStaking.connect(wallet1).delegate(0, wallet2.address);

            expect((await ctStaking.power(wallet2.address)).own).to.be.eq(0);
            expect((await ctStaking.power(wallet2.address)).delegated).to.be.eq(
                100,
            );

            await increaseTime(3600);

            await ctStaking.connect(wallet1).unstake(0, '0x00', true);

            expect((await ctStaking.power(wallet2.address)).own).to.be.eq(0);
            expect((await ctStaking.power(wallet2.address)).delegated).to.be.eq(
                0,
            );
        });
    });

    describe('delegate()', function () {
        before(async function () {
            // stake 1
            await ctStaking.stake(100, stakeType, '0x00');
            // stake 2
            await ctStaking.stake(1000, stakeType, '0x00');
            // stake 3
            await ctStaking.stake(10000, stakeType, '0x00');
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

        it('should delegate to empty account', async () => {
            await ctStaking.delegate(1, alice.address);
            expect((await ctStaking.power(alice.address)).delegated).to.eq(100);
        });

        it('should get the total voting power', async () => {
            const totalVotingPower = await ctStaking.totalVotingPower();
            expect(totalVotingPower).to.eq(100 + 100 + 1000 + 10000);
        });

        it('should get the total  power', async () => {
            const {own, delegated} = await ctStaking.totalPower();
            expect(own).to.eq(11100);
            expect(delegated).to.eq(100);
        });

        it('should un-delegate to self', async () => {
            await ctStaking.delegate(1, owner.address);
            expect((await ctStaking.power(owner.address)).own).to.eq(11100);
            expect((await ctStaking.power(alice.address)).delegated).to.eq(0);
        });

        it('should re-delegate to another account', async () => {
            await ctStaking.delegate(2, alice.address);
            expect((await ctStaking.power(alice.address)).delegated).to.eq(
                1000,
            );

            await ctStaking.delegate(2, bob.address);
            expect((await ctStaking.power(alice.address)).delegated).to.eq(0);
            expect((await ctStaking.power(bob.address)).delegated).to.eq(1000);
        });
    });

    describe('undelegate()', function () {
        before(async function () {
            // stake 4
            await ctStaking.stake(200, stakeType, '0x00');
        });

        it('should undelegate after delegation', async () => {
            await ctStaking.delegate(4, wallet1.address);
            expect((await ctStaking.power(wallet1.address)).delegated).to.eq(
                200,
            );

            await ctStaking.undelegate(4);
            expect((await ctStaking.power(wallet1.address)).delegated).to.eq(0);
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
            snapshotBlockNum = (await provider.getBlock('latest')).number;

            // stake 0
            await ctStaking.connect(wallet3).stake(100, stakeType, '0x00');
            // stake 1
            await ctStaking.connect(wallet3).stake(200, stakeType, '0x00');
            // stake 2
            await ctStaking.connect(wallet3).stake(300, stakeType, '0x00');
            // stake 3
            await ctStaking.connect(wallet3).stake(400, stakeType, '0x00');
            // stake 4
            await ctStaking.connect(wallet3).stake(500, stakeType, '0x00');
            await increaseTime(3600);

            expect(await ctStaking.snapshotLength(wallet3.address)).to.eq(5);

            snapshot1 = await ctStaking.snapshot(wallet3.address, 0);
            snapshot2 = await ctStaking.snapshot(wallet3.address, 1);
            snapshot3 = await ctStaking.snapshot(wallet3.address, 2);
            snapshot4 = await ctStaking.snapshot(wallet3.address, 3);
            snapshot5 = await ctStaking.snapshot(wallet3.address, 4);
        });

        const getAllSnapshots = async (user: SignerWithAddress) => {
            const length = await ctStaking.snapshotLength(user.address);

            const allUserSnapshots = [];

            for (let i = BigNumber.from(0); i.lt(length); i = i.add(1)) {
                const ss = await ctStaking.snapshot(user.address, i);
                allUserSnapshots.push(ss);
            }

            return allUserSnapshots;
        };

        it('should check snapshot info for snapshot1', async () => {
            expect(snapshot1.beforeBlock).to.eq(snapshotBlockNum + 1);
            expect(snapshot1.ownPower).to.eq(0);
        });

        it('should check snapshot info for snapshot2', async () => {
            expect(snapshot2.beforeBlock).to.eq(snapshotBlockNum + 2);
            expect(snapshot2.ownPower).to.eq(100);
        });

        it('should check snapshot info for snapshot3', async () => {
            expect(snapshot3.beforeBlock).to.eq(snapshotBlockNum + 3);
            expect(snapshot3.ownPower).to.eq(300);
        });

        it('should check snapshot info for snapshot4', async () => {
            expect(snapshot4.beforeBlock).to.eq(snapshotBlockNum + 4);
            expect(snapshot4.ownPower).to.eq(600);
        });

        it('should check snapshot info for snapshot5', async () => {
            expect(snapshot5.beforeBlock).to.eq(snapshotBlockNum + 5);
            expect(snapshot5.ownPower).to.eq(1000);
        });

        it('should return correct length of stakes', async () => {
            expect(await ctStaking.stakesNum(wallet3.address)).to.eq(5);
        });

        it('should return correct block number of latest snapshot', async () => {
            expect(await ctStaking.latestSnapshotBlock(wallet3.address)).to.eq(
                snapshotBlockNum + 5,
            );
        });

        it('should return correct block number for latest global snapshot', async () => {
            expect(await ctStaking.latestGlobalsSnapshotBlock()).to.eq(
                snapshotBlockNum + 5,
            );
        });

        it('should return correct length of snapshots for each user', async () => {
            expect(await ctStaking.snapshotLength(wallet1.address)).to.eq(4);
            expect(await ctStaking.snapshotLength(wallet2.address)).to.eq(1);
            expect(await ctStaking.snapshotLength(wallet3.address)).to.eq(5);
            expect(await ctStaking.snapshotLength(alice.address)).to.eq(3);
            expect(await ctStaking.snapshotLength(bob.address)).to.eq(1);
        });

        it('should return correct snapshot length for global address', async () => {
            expect(await ctStaking.globalsSnapshotLength()).to.be.eq(18);
        });

        it('should get correct power for global address', async () => {
            const length = await ctStaking.globalsSnapshotLength();
            const lastIndex = length.sub(1);

            const {ownPower, delegatedPower} = await ctStaking.globalsSnapshot(
                lastIndex,
            );

            expect(ownPower).to.be.eq(11400);
            expect(delegatedPower).to.be.eq(1000);
        });

        it('should not get snapshot of global account if block number is invalid', async () => {
            const blockNum = ethers.constants.MaxUint256;
            const hint = 999;

            await expect(
                ctStaking.globalSnapshotAt(blockNum, hint),
            ).to.be.revertedWith('Staking: Too big block number');
        });

        it('should get requested snapshot when hint is correct', async () => {
            const snapshotLength = await ctStaking.snapshotLength(
                wallet1.address,
            );

            const snapshotLastIndex = snapshotLength.sub(1);

            const {ownPower, delegatedPower, beforeBlock} =
                await ctStaking.snapshot(wallet1.address, snapshotLastIndex);

            const snapshot = await ctStaking.snapshotAt(
                wallet1.address,
                beforeBlock,
                snapshotLastIndex,
            );

            expect(snapshot.ownPower).to.be.eq(ownPower);
            expect(snapshot.delegatedPower).to.be.eq(delegatedPower);
            expect(snapshot.beforeBlock).to.be.eq(beforeBlock);
        });

        it('should get latest snapshot when hint is incorrect and snapshot not found', async () => {
            const blockNum = (await provider.getBlock('latest')).number;
            const hint = 1;

            const snapshot = await ctStaking.snapshotAt(
                owner.address,
                blockNum,
                hint,
            );

            const allUserSnapshots = await getAllSnapshots(owner);
            const length = allUserSnapshots.length;

            const lastSnapshot = allUserSnapshots[length - 1];

            expect(snapshot.beforeBlock).to.be.eq(blockNum);
            expect(snapshot.ownPower).to.be.eq(lastSnapshot.ownPower);
            expect(snapshot.delegatedPower).to.be.eq(
                lastSnapshot.delegatedPower,
            );
        });

        it('should get snapshot when hint is incorrect and snapshot is found', async () => {
            const allUserSnapshots = await getAllSnapshots(owner);
            const length = allUserSnapshots.length;

            // select one snapshot randomly
            const randomIndex = Math.floor(Math.random() * length);
            const selectedSnapshot = allUserSnapshots[randomIndex];

            const blockNum = selectedSnapshot.beforeBlock;
            const hint = randomIndex + 1; // incorrect

            const snapshot = await ctStaking.snapshotAt(
                owner.address,
                blockNum,
                hint,
            );

            expect(snapshot.beforeBlock).to.be.eq(blockNum);
            expect(snapshot.ownPower).to.be.eq(selectedSnapshot.ownPower);
            expect(snapshot.delegatedPower).to.be.eq(
                selectedSnapshot.delegatedPower,
            );
        });
    });

    describe('addTerms()', function () {
        it("reverts if it's called by not owner", async () => {
            await expect(
                ctStaking.connect(wallet1).addTerms(stakeType1, validTerms),
            ).to.be.revertedWith('ImmOwn: unauthorized');
        });

        it("reverts if it's trying to add existing terms", async () => {
            await expect(
                ctStaking.addTerms(stakeType, validTerms),
            ).to.be.revertedWith('Staking:E1');
        });

        it('reverts if isEnabled is false', async () => {
            await expect(
                ctStaking.addTerms(stakeType1, {
                    ...validTerms,
                    isEnabled: false,
                }),
            ).to.be.revertedWith('Staking:E2');
        });

        it('reverts if allowedTill is less than current timestamp', async () => {
            await expect(
                ctStaking.addTerms(stakeType1, {
                    ...validTerms,
                    allowedTill: utils.hexZeroPad('0x01', 32),
                }),
            ).to.be.revertedWith('Staking:E3');
        });

        it('reverts if allowedSince is greater than allowedTill', async () => {
            const now = await getBlockTimestamp();
            await expect(
                ctStaking.addTerms(stakeType1, {
                    ...validTerms,
                    allowedSince: toBytes32(Math.floor(now + 2000)),
                    allowedTill: toBytes32(Math.floor(now + 1000)),
                }),
            ).to.be.revertedWith('Staking:E4');
        });

        it('reverts if maxAmountScaled is less than minAmountScaled', async () => {
            await expect(
                ctStaking.addTerms(stakeType1, {
                    ...validTerms,
                    maxAmountScaled: utils.hexZeroPad('0x11', 32),
                    minAmountScaled: utils.hexZeroPad('0x22', 32),
                }),
            ).to.be.revertedWith('Staking:E5');
        });

        it('reverts if two lock time parameters are non-zero', async () => {
            await expect(
                ctStaking.addTerms(stakeType1, {
                    ...validTerms,
                    minLockPeriod: utils.hexZeroPad('0x00', 32),
                    lockedTill: utils.hexZeroPad('0x1E', 32),
                    exactLockPeriod: utils.hexZeroPad('0x1E', 32),
                }),
            ).to.be.revertedWith('Staking:E6');

            await expect(
                ctStaking.addTerms(stakeType1, {
                    ...validTerms,
                    minLockPeriod: utils.hexZeroPad('0x00', 32),
                    lockedTill: utils.hexZeroPad('0x1E', 32),
                    exactLockPeriod: utils.hexZeroPad('0x00', 32),
                }),
            ).to.be.revertedWith('Staking:E7');

            await expect(
                ctStaking.addTerms(stakeType1, {
                    ...validTerms,
                    minLockPeriod: utils.hexZeroPad('0x1E', 32),
                    lockedTill: utils.hexZeroPad('0x00', 32),
                    exactLockPeriod: utils.hexZeroPad('0x1E', 32),
                }),
            ).to.be.revertedWith('Staking:E8');
        });

        describe('with valid terms', async () => {
            let _snapshot: any;

            beforeEach(async () => {
                _snapshot = await ethers.provider.send('evm_snapshot', []);
            });

            afterEach(async () => {
                await ethers.provider.send('evm_revert', [_snapshot]);
            });

            it('succeeds if allowedSince is less than allowedTill', async () => {
                const now = await getBlockTimestamp();

                const since = Math.floor(now + 1000);
                const till = Math.floor(now + 2000);
                await ctStaking.addTerms(stakeType1, {
                    ...validTerms,
                    allowedSince: toBytes32(since),
                    allowedTill: toBytes32(till),
                });
                const termRes = await ctStaking.terms(stakeType1);
                expect(termRes.allowedSince).to.eq(since);
                expect(termRes.allowedTill).to.eq(till);
            });

            it('succeeds', async () => {
                await ctStaking.addTerms(stakeType1, validTerms);
                const termRes = await ctStaking.terms(stakeType1);
                expect(termRes.isEnabled).to.eq(true);
                expect(termRes.isRewarded).to.eq(true);
                expect(termRes.minAmountScaled).to.eq(0);
                expect(termRes.maxAmountScaled).to.eq(0);
                expect(termRes.allowedSince).to.eq(0);
                expect(termRes.allowedTill).to.eq(0);
                expect(termRes.lockedTill).to.eq(0);
                expect(termRes.exactLockPeriod).to.eq(0);
                expect(termRes.minLockPeriod).to.eq(30);
            });

            it('succeeds with lockedTill', async () => {
                const now = await getBlockTimestamp();
                const till = Math.floor(now + 10000);
                await ctStaking.addTerms(stakeType1, {
                    ...validTerms,
                    lockedTill: toBytes32(till),
                    minLockPeriod: utils.hexZeroPad('0x00', 32),
                });
                const termRes = await ctStaking.terms(stakeType1);
                expect(termRes.allowedTill).to.eq(0);
                expect(termRes.lockedTill).to.eq(till);
                expect(termRes.exactLockPeriod).to.eq(0);
                expect(termRes.minLockPeriod).to.eq(0);
            });
        });
    });

    describe('disableTerms()', function () {
        it("reverts if it's called by not owner", async () => {
            await expect(
                ctStaking.connect(wallet1).disableTerms(stakeType1),
            ).to.be.revertedWith('ImmOwn: unauthorized');
        });

        it('reverts if it tries to disable non-existing terms', async () => {
            await expect(
                ctStaking.disableTerms('0x4ab0941c'),
            ).to.be.revertedWith('Staking:E9');
        });

        describe('with terms added', async () => {
            let _snapshot: any;

            beforeEach(async () => {
                _snapshot = await ethers.provider.send('evm_snapshot', []);
                await ctStaking.addTerms(stakeType1, validTerms);
                await ctStaking.disableTerms(stakeType1);
            });

            afterEach(async () => {
                await ethers.provider.send('evm_revert', [_snapshot]);
            });

            it('should set isEnabled to false', async () => {
                const terms = await ctStaking.terms(stakeType1);
                expect(terms.isEnabled).to.eq(false);
            });

            it('reverts if it tries to disable disabled term', async () => {
                await expect(
                    ctStaking.disableTerms(stakeType1),
                ).to.be.revertedWith('Staking:EA');
            });
        });
    });
});
