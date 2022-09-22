import {
    increaseTime,
    mineBlock,
    revertSnapshot,
    takeSnapshot,
} from '../../lib/hardhat';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import {ethers} from 'hardhat';
import {assert, expect} from 'chai';
import {BigNumber, BigNumberish} from 'ethers';
import {data} from './assets/advancesStakingData.data';

import {
    FakePantherPoolV0,
    FakePrpGrantor,
    MockAdvancedStakeRewardController,
    TokenMock,
    ERC721Mock,
} from '../../types/contracts';
import {getBlockTimestamp} from '../../lib/provider';

describe('AdvancedStakeRewardController', () => {
    const fakeVaultAddress = '0x4321555555555555555555555555555555551234';
    const rewardingPeriod = 200;
    const prpRewardPerStake = 10000;
    const rewardingStartApy = 70;
    const rewardingEndApy = 40;
    const rewardingRoundingNumber = BigNumber.from('10000000000000000');
    const advStake = '0xcc995ce8';
    const asrControllerZkpBalance = BigNumber.from(10).pow(24);
    const asrControllerPrpBalance = BigNumber.from(10 * prpRewardPerStake);
    const asrControllerNftRewardsLimit = BigNumber.from(10);

    let asrController: MockAdvancedStakeRewardController;
    let zkpToken: TokenMock;
    let nftToken: ERC721Mock;
    let owner: SignerWithAddress;
    let staker: SignerWithAddress;
    let rewardMaster: SignerWithAddress;
    let pantherPool: FakePantherPoolV0;
    let prpGrantor: FakePrpGrantor;
    let rewardingStartTime: number;
    let rewardingEndTime: number;
    let snapshotId: number;

    type RewardParams = {
        startTime: number;
        endZkpApy: number;
        endTime: number;
        startZkpApy: number;
        prpPerStake: number;
    };

    const getDefaultRewardParams = (): RewardParams => ({
        startTime: rewardingStartTime,
        endTime: rewardingEndTime,
        startZkpApy: rewardingStartApy,
        endZkpApy: rewardingEndApy,
        prpPerStake: prpRewardPerStake,
    });

    before(async () => {
        rewardingStartTime = (await getBlockTimestamp()) + 100;
        rewardingEndTime = rewardingStartTime + rewardingPeriod;

        [, owner, staker, rewardMaster] = await ethers.getSigners();

        const ZkpToken = await ethers.getContractFactory('TokenMock');
        zkpToken = (await ZkpToken.connect(owner).deploy()) as TokenMock;

        const NftToken = await ethers.getContractFactory('ERC721Mock');
        nftToken = (await NftToken.connect(owner).deploy()) as ERC721Mock;

        const FakePantherPoolV0 = await ethers.getContractFactory(
            'FakePantherPoolV0',
        );
        const exitTime = rewardingStartTime + rewardingPeriod + 100;
        pantherPool = (await FakePantherPoolV0.deploy(
            fakeVaultAddress,
            exitTime,
        )) as FakePantherPoolV0;

        const FakePrpGrantor = await ethers.getContractFactory(
            'FakePrpGrantor',
        );
        prpGrantor = (await FakePrpGrantor.deploy()) as FakePrpGrantor;

        const MockAdvancedStakeRewardController =
            await ethers.getContractFactory(
                'MockAdvancedStakeRewardController',
            );
        asrController = (await MockAdvancedStakeRewardController.deploy(
            owner.address,
            rewardMaster.address,
            pantherPool.address,
            prpGrantor.address,
            zkpToken.address,
            nftToken.address,
        )) as MockAdvancedStakeRewardController;

        await asrController
            .connect(owner)
            .updateRewardParams(getDefaultRewardParams());

        // send some ZKPs for rewards
        await zkpToken
            .connect(owner)
            .transfer(asrController.address, asrControllerZkpBalance);

        // grant PRPs for rewards
        await prpGrantor.issueOwnerGrant(
            asrController.address,
            asrControllerPrpBalance,
        );
    });

    beforeEach(async () => {
        snapshotId = await takeSnapshot();
    });

    afterEach(async () => {
        await revertSnapshot(snapshotId);
    });

    describe('getZkpApyAt (external view)', () => {
        it('should return 0 if called before rewarding start time', async () => {
            const {startTime} = getDefaultRewardParams();

            expect(await asrController.getZkpApyAt(startTime - 5)).to.eq(0);
        });

        it('should return `rewardingStartApy` if called on rewarding start time', async () => {
            const {startTime} = getDefaultRewardParams();

            expect(await asrController.getZkpApyAt(startTime)).to.eq(
                rewardingStartApy,
            );
        });

        it('should return `rewardingEndApy` if called on rewarding end time', async () => {
            const {endTime} = getDefaultRewardParams();

            expect(await asrController.getZkpApyAt(endTime)).to.eq(
                rewardingEndApy,
            );
        });

        it('should return 0 if called after rewarding end time', async () => {
            const {endTime} = getDefaultRewardParams();

            expect(await asrController.getZkpApyAt(endTime + 100)).to.eq(0);
        });

        it('should return `startZkpApy-(startZkpApy-endZkpApy)/4` if called in between  at `startTime+rewardPeriod/4`', async () => {
            const {endTime, startTime} = getDefaultRewardParams();
            const rewardPeriod = endTime - startTime;

            const scaledApyDrop = BigNumber.from(
                rewardingStartApy - rewardingEndApy,
            )
                .mul(1e9)
                .div(4);
            const expApy =
                rewardingStartApy - scaledApyDrop.div(1e9).toNumber();
            expect(
                await asrController.getZkpApyAt(
                    parseInt(`${startTime + rewardPeriod / 4}`),
                ),
            ).to.eq(expApy);
        });

        it('should return `startZkpApy-(startZkpApy-endZkpApy)*3/4` if called at `startTime+rewardPeriod*3/4`', async () => {
            const {endTime, startTime} = getDefaultRewardParams();
            const rewardPeriod = endTime - startTime;
            const scaledApyDrop = BigNumber.from(
                rewardingStartApy - rewardingEndApy,
            )
                .mul(3e9)
                .div(4);
            const expApy =
                rewardingStartApy - scaledApyDrop.div(1e9).toNumber();
            expect(
                await asrController.getZkpApyAt(
                    parseInt(`${startTime + (rewardPeriod * 3) / 4}`),
                ),
            ).to.eq(expApy);
        });
    });

    describe('_computeZkpReward (internal view)', () => {
        describe('for a deposit of 0 (zero $ZKPs staked)', () => {
            const stakedAmount = BigNumber.from(0);

            it('should revert if called w/ `lockedTill` before `stakedAt`', async () => {
                const rewardParams = getDefaultRewardParams();
                const stakedAt = rewardParams.startTime + 2;
                const lockedTill = rewardParams.startTime + 1;

                await expect(
                    asrController.internalComputeZkpReward(
                        stakedAmount,
                        lockedTill,
                        stakedAt,
                        rewardParams,
                    ),
                ).to.be.reverted;
            });

            it('should return 0 if called w/ `stakedAt` in between rewarding period', async () => {
                const rewardParams = getDefaultRewardParams();
                const stakedAt =
                    rewardParams.startTime +
                    (rewardParams.endTime - rewardParams.startTime) / 2;
                const lockedTill = stakedAt + 10;
                const expReward = 0;

                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        lockedTill,
                        stakedAt,
                        rewardParams,
                    ),
                ).to.eq(expReward);
            });

            it('should return 0 if called w/ `stakedAt` after rewarding end time', async () => {
                const rewardParams = getDefaultRewardParams();
                const stakedAt = rewardParams.endTime + 5;
                const lockedTill = rewardParams.endTime + 10;
                const expReward = 0;

                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        lockedTill,
                        stakedAt,
                        rewardParams,
                    ),
                ).to.eq(expReward);
            });
        });

        describe('for a deposit of 1e5 $ZKP', () => {
            const stakedAmount = BigNumber.from(1e9).mul(1e14);

            it('should return 0 if called w/ `lockedTill` before rewarding start time', async () => {
                const rewardParams = getDefaultRewardParams();
                const stakedAt = rewardParams.startTime - 10;
                const lockedTill = rewardParams.startTime - 5;
                const expReward = 0;

                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        lockedTill,
                        stakedAt,
                        rewardParams,
                    ),
                ).to.eq(expReward);
            });

            it('should return zero amount if called w/ `stakedAt` after rewarding end time', async () => {
                const rewardParams = getDefaultRewardParams();
                const stakedAt = rewardParams.endTime + 5;
                const lockedTill = rewardParams.endTime + 10;
                const expReward = 0;

                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        lockedTill,
                        stakedAt,
                        rewardParams,
                    ),
                ).to.eq(expReward);
            });

            describe('when `stakedAt` is rewarding start time and `lockedTill` equals to rewarding end time', () => {
                it('should return the expected reward amount', async () => {
                    const rewardParams = getDefaultRewardParams();
                    const stakedAt = rewardParams.startTime;
                    const lockedTill = rewardParams.endTime;

                    const expReward = stakedAmount
                        .mul(rewardParams.startZkpApy)
                        .mul(rewardParams.endTime - rewardParams.startTime)
                        .div(365 * 86400 * 100)
                        .div(rewardingRoundingNumber)
                        .mul(rewardingRoundingNumber);

                    expect(
                        await asrController.internalComputeZkpReward(
                            stakedAmount,
                            lockedTill,
                            stakedAt,
                            rewardParams,
                        ),
                    ).to.eq(expReward);
                });
            });
        });

        describe('for predefined test cases', () => {
            const stakedAmount = BigNumber.from(54321).mul(
                '1000000000000000000',
            ); // 54321 $ZKP

            it('should return the expected reward amount for the case 1', async () => {
                // Staked after the rewarding start time, till before the rewarding end time
                const rewardParams = getDefaultRewardParams();
                const stakedAt = rewardParams.startTime + 23;
                const lockedTill = rewardParams.endTime - 23;
                const expReward = getRewardAmount(
                    stakedAmount,
                    lockedTill,
                    stakedAt,
                    rewardParams,
                );
                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        lockedTill,
                        stakedAt,
                        rewardParams,
                    ),
                ).to.eq(expReward);
            });

            it('should return the expected reward amount for the case 2', async () => {
                // Staked before the rewarding start time, till before the rewarding start time
                const rewardParams = getDefaultRewardParams();
                const stakedAt = rewardParams.startTime - 4;
                const lockedTill = rewardParams.startTime - 1;
                const expReward = 0;

                // no rewards before the rewarding start time
                assert(expReward.toString() == '0');

                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        lockedTill,
                        stakedAt,
                        rewardParams,
                    ),
                ).to.eq(expReward);
            });

            it('should return the expected reward amount for the case 3', async () => {
                // Staked before the rewarding start time, till the rewarding start time
                const rewardParams = getDefaultRewardParams();
                const stakedAt = rewardParams.startTime - 4;
                const lockedTill = rewardParams.startTime;
                const expReward = getRewardAmount(
                    stakedAmount,
                    lockedTill,
                    stakedAt,
                    rewardParams,
                );

                // no rewards before the rewarding start time
                assert(expReward.toString() == '0');

                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        lockedTill,
                        stakedAt,
                        getDefaultRewardParams(),
                    ),
                ).to.eq(expReward);
            });

            it('should return the expected reward amount for the case 4', async () => {
                // Staked before the rewarding start time, till before the rewarding end time
                const rewardParams = getDefaultRewardParams();
                const stakedAt = rewardParams.startTime - 4;
                const lockedTill =
                    rewardParams.startTime +
                    (rewardParams.endTime - rewardParams.startTime) / 2;
                // reward shall be the same as for a stake done exactly at rewarding start time ...
                const expReward = getRewardAmount(
                    stakedAmount,
                    lockedTill,
                    rewardParams.startTime,
                    rewardParams,
                );
                // ... and it shall not be 0
                assert(BigNumber.from(expReward).gt(0));

                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        lockedTill,
                        stakedAt,
                        getDefaultRewardParams(),
                    ),
                ).to.eq(expReward);
            });

            it('should return the expected reward amount for the case 5', async () => {
                // Staked on the rewarding start time, till before the rewarding end time
                const rewardParams = getDefaultRewardParams();
                const stakedAt = rewardParams.startTime;
                const lockedTill =
                    rewardParams.startTime +
                    (rewardParams.endTime - rewardParams.startTime) / 2;
                const expReward = getRewardAmount(
                    stakedAmount,
                    lockedTill,
                    stakedAt,
                    rewardParams,
                );

                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        lockedTill,
                        stakedAt,
                        getDefaultRewardParams(),
                    ),
                ).to.eq(expReward);
            });

            it('should return the expected reward amount for the case 6', async () => {
                // Staked after the rewarding start time, till before the rewarding end time
                const rewardParams = getDefaultRewardParams();
                const stakedAt = rewardParams.startTime + 10;
                const lockedTill =
                    rewardParams.startTime +
                    (rewardParams.endTime - rewardParams.startTime) / 2;
                const expReward = getRewardAmount(
                    stakedAmount,
                    lockedTill,
                    stakedAt,
                    rewardParams,
                );

                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        lockedTill,
                        stakedAt,
                        getDefaultRewardParams(),
                    ),
                ).to.eq(expReward);
            });

            it('should return the expected reward amount for the case 7', async () => {
                // Staked after the rewarding start time, till after the rewarding end time
                const rewardParams = getDefaultRewardParams();
                const stakedAt = rewardParams.startTime + 10;
                const lockedTill =
                    rewardParams.startTime +
                    (rewardParams.endTime - rewardParams.startTime) / 2 +
                    300;
                const expReward = getRewardAmount(
                    stakedAmount,
                    lockedTill,
                    stakedAt,
                    rewardParams,
                );

                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        lockedTill,
                        stakedAt,
                        getDefaultRewardParams(),
                    ),
                ).to.eq(expReward);
            });

            it('should return the expected reward amount for the case 8', async () => {
                // Staked on the rewarding end time, till after that
                const rewardParams = getDefaultRewardParams();
                const stakedAt = rewardParams.endTime;
                const lockedTill = rewardParams.endTime + 300;
                const expReward = getRewardAmount(
                    stakedAmount,
                    lockedTill,
                    stakedAt,
                    rewardParams,
                );

                // no rewards on and after the rewarding end time
                assert(expReward.toString() == '0');

                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        lockedTill,
                        stakedAt,
                        getDefaultRewardParams(),
                    ),
                ).to.eq(expReward);
            });

            it('should return the expected reward amount for the case 9', async () => {
                // Staked after the rewarding end time, till even later
                const rewardParams = getDefaultRewardParams();
                const stakedAt = rewardParams.endTime + 10;
                const lockedTill = rewardParams.endTime + 300;
                const expReward = getRewardAmount(
                    stakedAmount,
                    lockedTill,
                    stakedAt,
                    rewardParams,
                );

                // no rewards after the rewarding end time
                assert(expReward.toString() == '0');

                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        lockedTill,
                        stakedAt,
                        getDefaultRewardParams(),
                    ),
                ).to.eq(expReward);
            });

            function getRewardAmount(
                stakedAmount: BigNumber,
                lockedTill: number,
                stakedAt: number,
                rewardParams: RewardParams,
            ) {
                assert(lockedTill > stakedAt);

                // No rewards for stakes withdrawn on or before the `rewardParams.startTime`
                if (lockedTill <= rewardParams.startTime) return 0;

                // No rewards for stakes made on or after the rewarding end time
                if (stakedAt >= rewardParams.endTime) return 0;

                const rewardedSince =
                    stakedAt >= rewardParams.startTime
                        ? stakedAt
                        : rewardParams.startTime;
                const rewardedTill =
                    lockedTill >= rewardParams.endTime
                        ? rewardParams.endTime
                        : lockedTill;
                const period = rewardedTill - rewardedSince;
                if (period == 0) return 0;

                const apyDiff = BigNumber.from(
                    rewardParams.startZkpApy - rewardParams.endZkpApy,
                );
                const apyDrop = apyDiff
                    .mul(rewardedSince - rewardParams.startTime)
                    .div(rewardParams.endTime - rewardParams.startTime);
                const apy = rewardParams.startZkpApy - apyDrop.toNumber();
                return stakedAmount
                    .mul(apy)
                    .mul(period)
                    .div(365 * 24 * 3600 * 100)
                    .div(rewardingRoundingNumber)
                    .mul(rewardingRoundingNumber);
            }
        });
    });

    describe('_getUpdatedLimit (internal pure)', () => {
        describe('if no limits have been used so far (i.e. `usedLimit == 0`)', () => {
            describe('when `available` equals to `currentLimit`', () => {
                it('should return (not-updated) `currentLimit`', async () => {
                    const {isUpdated, limit} =
                        await asrController.internalGetUpdatedLimit(
                            1000,
                            1000,
                            0,
                        );

                    expect(isUpdated).to.be.eq(false);
                    expect(limit).to.be.eq(1000);
                });
            });

            describe('when `available` exceeds `currentLimit`', () => {
                it('should return (updated) `available`', async () => {
                    const {isUpdated, limit} =
                        await asrController.internalGetUpdatedLimit(
                            1100,
                            1000,
                            0,
                        );

                    expect(isUpdated).to.be.eq(true);
                    expect(limit).to.be.eq(1100);
                });
            });

            describe('when `available` is less than `currentLimit`', () => {
                it('should return (updated) `available`', async () => {
                    const {isUpdated, limit} =
                        await asrController.internalGetUpdatedLimit(
                            900,
                            1000,
                            0,
                        );

                    expect(isUpdated).to.be.eq(true);
                    expect(limit).to.be.eq(900);
                });
            });

            describe('when `available` is zero while `currentLimit` is non-zero', () => {
                it('should return (updated) zero', async () => {
                    const {isUpdated, limit} =
                        await asrController.internalGetUpdatedLimit(0, 1000, 0);

                    expect(isUpdated).to.be.eq(true);
                    expect(limit).to.be.eq(0);
                });
            });

            describe('when both `available` and `currentLimit` are zeros', () => {
                it('should return (non-updated) zero', async () => {
                    const {isUpdated, limit} =
                        await asrController.internalGetUpdatedLimit(0, 0, 0);

                    expect(isUpdated).to.be.eq(false);
                    expect(limit).to.be.eq(0);
                });
            });
        });

        describe('when some limits have been already used', () => {
            describe('if `available` equals to the unused limit (i.e. `currentLimit - usedLimit`)', () => {
                it('should return (non-updated) `currentLimit`', async () => {
                    const {isUpdated, limit} =
                        await asrController.internalGetUpdatedLimit(
                            1001,
                            2003,
                            1002,
                        );

                    expect(isUpdated).to.be.eq(false);
                    expect(limit).to.be.eq(2003);
                });
            });

            describe('if `available` exceeds the unused limit', () => {
                it('should return (updated) `currentLimit` increased by the surplus', async () => {
                    const {isUpdated, limit} =
                        await asrController.internalGetUpdatedLimit(
                            1000,
                            1000,
                            900,
                        );

                    expect(isUpdated).to.be.eq(true);
                    expect(limit).to.be.eq(1900);
                });
            });

            describe('if `available` is less than the unused limit', () => {
                describe('but `available` is still more than the shortage', () => {
                    it('should return (updated) `currentLimit` decreased by the shortage', async () => {
                        const {isUpdated, limit} =
                            await asrController.internalGetUpdatedLimit(
                                900,
                                1000,
                                80,
                            );

                        expect(isUpdated).to.be.eq(true);
                        expect(limit).to.be.eq(980);
                    });
                });

                describe('and the shortage exceeds `available`', () => {
                    it('should return (updated) `usedLimit`', async () => {
                        const {isUpdated, limit} =
                            await asrController.internalGetUpdatedLimit(
                                100,
                                1000,
                                810,
                            );

                        expect(isUpdated).to.be.eq(true);
                        expect(limit).to.be.eq(910);
                    });
                });
            });

            describe('when `available` is zero while `currentLimit` is non-zero', () => {
                describe('if `currentLimit` equals to `usedLimit`', () => {
                    it('should return (non-updated) `currentLimit`', async () => {
                        const {isUpdated, limit} =
                            await asrController.internalGetUpdatedLimit(
                                0,
                                1000,
                                1000,
                            );

                        expect(isUpdated).to.be.eq(false);
                        expect(limit).to.be.eq(1000);
                    });
                });

                describe('if `currentLimit` exceeds `usedLimit`', () => {
                    it('should return (updated) `usedLimit`', async () => {
                        const {isUpdated, limit} =
                            await asrController.internalGetUpdatedLimit(
                                0,
                                1000,
                                999,
                            );

                        expect(isUpdated).to.be.eq(true);
                        expect(limit).to.be.eq(999);
                    });
                });
            });

            describe('if `usedLimit` exceeds `currentLimit`', () => {
                it('should revert', async () => {
                    await expect(
                        asrController.internalGetUpdatedLimit(100, 1000, 1001),
                    ).to.be.reverted;
                });
            });
        });
    });

    describe('updateZkpAndPrpRewardsLimit (external)', () => {
        beforeEach(async () => {
            // Make sure the allowance is not yet set
            expect(
                await zkpToken.allowance(
                    asrController.address,
                    fakeVaultAddress,
                ),
            ).to.be.eq(BigNumber.from(0));
        });

        it('should update the PRP reward limits', async () => {
            await asrController.updateZkpAndPrpRewardsLimit();

            expect((await asrController.limits()).prpRewards).to.be.eq(
                asrControllerPrpBalance,
            );
        });

        it('should update ZKP reward limit and approve Vault as spender', async () => {
            await asrController.updateZkpAndPrpRewardsLimit();

            expect((await asrController.limits()).zkpRewards).to.be.eq(
                asrControllerZkpBalance,
            );

            expect(
                await zkpToken.allowance(
                    asrController.address,
                    fakeVaultAddress,
                ),
            ).to.be.eq(asrControllerZkpBalance);
        });
    });

    describe('setNftRewardLimit (external)', () => {
        beforeEach(async () => {
            assert(
                !(await nftToken.isApprovedForAll(
                    asrController.address,
                    fakeVaultAddress,
                )),
            );
        });

        describe('if called by the owner', () => {
            it('should update NFT reward limit and set Vault as operator', async () => {
                await asrController
                    .connect(owner)
                    .setNftRewardLimit(asrControllerNftRewardsLimit);

                expect((await asrController.limits()).nftRewards).to.be.eq(
                    asrControllerNftRewardsLimit,
                );

                expect(
                    await nftToken.isApprovedForAll(
                        asrController.address,
                        fakeVaultAddress,
                    ),
                ).to.be.eq(true);
            });

            it('should revert if the desired nft limit is zero', async () => {
                await expect(
                    asrController.connect(owner).setNftRewardLimit(0),
                ).revertedWith('ARC: low nft rewards limit');
            });

            describe('if desired limit is less or equal to the amount of already rewarded NFTs', () => {
                beforeEach(async () => {
                    await asrController.connect(owner).setNftRewardLimit(3000);

                    await asrController.fakeTotals({
                        zkpRewards: 1e15,
                        prpRewards: 1e5,
                        nftRewards: 3323,
                        scZkpStaked: 1000,
                    });
                });

                it('should revert', async () => {
                    await expect(
                        asrController.connect(owner).setNftRewardLimit(3322),
                    ).revertedWith('ARC: low nft rewards limit');

                    await expect(
                        asrController.connect(owner).setNftRewardLimit(3323),
                    ).revertedWith('ARC: low nft rewards limit');
                });
            });
        });

        describe('if called by non-owner', () => {
            it('should revert', async () => {
                await expect(
                    asrController.setNftRewardLimit(
                        asrControllerNftRewardsLimit,
                    ),
                ).revertedWith('ImmOwn: unauthorized');
            });
        });
    });

    describe('_generateRewards (internal)', () => {
        let message: string;
        const amountToStake = ethers.utils.parseEther('1000');
        const amountToStakeStr = ethers.utils.hexZeroPad(
            amountToStake.toHexString(),
            12,
        );

        async function checkTotals(
            scZkpStaked: BigNumberish,
            zkpRewards: BigNumberish,
            prpRewards: BigNumberish,
            nftRewards: BigNumberish,
        ) {
            expect((await asrController.totals()).scZkpStaked).to.be.eq(
                BigNumber.from(scZkpStaked),
                'scZkpStaked',
            );
            expect((await asrController.totals()).zkpRewards).to.be.eq(
                BigNumber.from(zkpRewards),
                'zkpRewards',
            );
            expect((await asrController.totals()).prpRewards).to.be.eq(
                prpRewards,
                'prpRewards',
            );
            expect((await asrController.totals()).nftRewards).to.be.eq(
                nftRewards,
                'nftRewards',
            );
        }

        describe('Failure', () => {
            it('should revert when stake amount is 0', async () => {
                const {endTime, startTime} = getDefaultRewardParams();
                const message = generateMessage(
                    staker.address,
                    '000000000000000000000000',
                    ethers.utils.hexValue(startTime),
                    ethers.utils.hexValue(endTime),
                );

                await expect(
                    asrController.internalGenerateRewards(message),
                ).revertedWith('ARC: unexpected zero stakeAmount');
            });

            it('should revert when stake time is greater than lock time', async () => {
                const {endTime, startTime} = getDefaultRewardParams();
                const message = generateMessage(
                    owner.address,
                    '0a0b0c0d0e0f000000ffffff',
                    ethers.utils.hexValue(endTime),
                    ethers.utils.hexValue(startTime),
                );

                await expect(
                    asrController.internalGenerateRewards(message),
                ).revertedWith('ARC: unexpected lockedTill');
            });

            it('should revert when not enough reward is available', async () => {
                const {endTime, startTime} = getDefaultRewardParams();
                const message = generateMessage(
                    staker.address,
                    '0a0b0c0d0e0f000000ffffff',
                    ethers.utils.hexValue(startTime),
                    ethers.utils.hexValue(endTime),
                );

                await expect(
                    asrController.internalGenerateRewards(message),
                ).revertedWith('ARC: too less rewards available');
            });
        });

        describe('Generate rewards', () => {
            let expZkpReward: BigNumber;
            let expScZkpStaked: BigNumber;
            let expPrpReward: number;

            beforeEach(async () => {
                const rewardParams = getDefaultRewardParams();
                expZkpReward = amountToStake
                    .mul(rewardParams.startZkpApy)
                    .mul(rewardParams.endTime - rewardParams.startTime)
                    .div(100 * 365 * 86400)
                    .div(rewardingRoundingNumber)
                    .mul(rewardingRoundingNumber);
                expScZkpStaked = amountToStake.div(1e15);
                expPrpReward = rewardParams.prpPerStake;

                await asrController.updateZkpAndPrpRewardsLimit();
                await asrController
                    .connect(owner)
                    .setNftRewardLimit(asrControllerNftRewardsLimit);

                const {endTime, startTime} = getDefaultRewardParams();
                message = generateMessage(
                    staker.address,
                    amountToStakeStr,
                    ethers.utils.hexValue(startTime),
                    ethers.utils.hexValue(endTime),
                );
            });

            describe('when called for the 1st time', () => {
                it('should emit `RewardGenerated` and set totals w/ expected params', async () => {
                    await expect(asrController.internalGenerateRewards(message))
                        .to.emit(asrController, 'RewardGenerated')
                        .withArgs(
                            staker.address,
                            0, // firstLeafId
                            expZkpReward,
                            expPrpReward,
                            1, // nft
                        );
                    await checkTotals(
                        expScZkpStaked,
                        expZkpReward,
                        expPrpReward,
                        1,
                    );
                });
            });

            describe('when called for the 2nd time', () => {
                it('should emit `RewardGenerated` and set totals w/ expected params', async () => {
                    await expect(
                        asrController.internalGenerateRewards(message),
                    );

                    await expect(asrController.internalGenerateRewards(message))
                        .to.emit(asrController, 'RewardGenerated')
                        .withArgs(
                            staker.address,
                            4, // firstLeafId
                            expZkpReward,
                            expPrpReward,
                            1, // nft
                        );

                    await checkTotals(
                        expScZkpStaked.mul(2),
                        expZkpReward.mul(2),
                        expPrpReward * 2,
                        2,
                    );
                });
            });

            describe('when called for the 3rd time', () => {
                it('should emit `RewardGenerated` and set totals w/ expected params', async () => {
                    await expect(
                        asrController.internalGenerateRewards(message),
                    );
                    await expect(
                        asrController.internalGenerateRewards(message),
                    );

                    await expect(asrController.internalGenerateRewards(message))
                        .to.emit(asrController, 'RewardGenerated')
                        .withArgs(
                            staker.address,
                            8, // firstLeafId
                            expZkpReward,
                            expPrpReward,
                            1, // nft
                        );

                    await checkTotals(
                        expScZkpStaked.mul(3),
                        expZkpReward.mul(3),
                        expPrpReward * 3,
                        3,
                    );
                });
            });
        });
    });

    describe('getRewardAdvice (external)', () => {
        let message: string;
        const amountToStakeStr = ethers.utils.hexZeroPad(
            ethers.utils.parseEther('1').toHexString(),
            12,
        );

        beforeEach(async () => {
            const {endTime, startTime} = getDefaultRewardParams();
            message = generateMessage(
                staker.address,
                amountToStakeStr,
                ethers.utils.hexValue(startTime),
                ethers.utils.hexValue(endTime),
            );
        });

        describe('Failure', () => {
            it('should revert when caller is not reward master', async () => {
                await expect(
                    asrController.getRewardAdvice(advStake, message),
                ).to.revertedWith('ARC: unauthorized');
            });

            it('should revert when stake action is invalid', async () => {
                await expect(
                    asrController
                        .connect(rewardMaster)
                        .getRewardAdvice('0x00000000', message),
                ).to.revertedWith('ARC: unsupported action');
            });
        });
    });

    describe('rescueErc20 (external)', () => {
        describe('Failure', () => {
            it('should revert when called by non owner', async () => {
                await expect(
                    asrController
                        .connect(rewardMaster)
                        .rescueErc20(zkpToken.address, owner.address, 1),
                ).to.revertedWith('ARC: unauthorized');
            });

            it('should revert when try to rescue ZKP before forbidden period', async () => {
                await expect(
                    asrController
                        .connect(owner)
                        .rescueErc20(zkpToken.address, owner.address, 1),
                ).to.revertedWith('ARC: too early withdrawal');
            });
        });

        describe('Rescue ZKP', () => {
            it('should rescue ZKP', async () => {
                // fast-forward to forbidden period
                const {endTime} = getDefaultRewardParams();
                await increaseTime(endTime + 10);
                await mineBlock();

                const initialOwnerBalance = await zkpToken.balanceOf(
                    owner.address,
                );

                await asrController
                    .connect(owner)
                    .rescueErc20(zkpToken.address, owner.address, 1000);

                expect(await zkpToken.balanceOf(owner.address)).to.be.eq(
                    initialOwnerBalance.add(1000),
                );
            });
        });
    });

    describe('updateRewardParams (external)', () => {
        describe('if new rewarding parameters are invalid', () => {
            it('should revert when new end time is less than new start time', async () => {
                const rewardParams = getDefaultRewardParams();
                rewardParams.endTime = rewardParams.startTime - 1;

                await expect(
                    asrController
                        .connect(owner)
                        .updateRewardParams(rewardParams),
                ).revertedWith('ARC: invalid time');
            });

            it('should revert when new end time is equal to new start time', async () => {
                const rewardParams = getDefaultRewardParams();
                rewardParams.endTime = rewardParams.startTime;

                await expect(
                    asrController
                        .connect(owner)
                        .updateRewardParams(rewardParams),
                ).revertedWith('ARC: invalid time');
            });

            it('should revert when new start APY is less than new end APY', async () => {
                const rewardParams = {
                    ...getDefaultRewardParams(),
                    startZkpApy: 50,
                    endZkpApy: 60,
                };

                await expect(
                    asrController
                        .connect(owner)
                        .updateRewardParams(rewardParams),
                ).revertedWith('ARC: invalid APY');
            });
        });

        describe('if called by owner', () => {
            it('should update the times, APYs and PRP reward per stake', async () => {
                const oldParams = getDefaultRewardParams();
                const rewardParams = {
                    startTime: oldParams.startTime + 10,
                    endTime: oldParams.endTime + 5,
                    startZkpApy: oldParams.startZkpApy + 3,
                    endZkpApy: oldParams.endZkpApy + 6,
                    prpPerStake: oldParams.prpPerStake + 777,
                };

                expect(
                    await asrController
                        .connect(owner)
                        .updateRewardParams(rewardParams),
                )
                    .to.emit(asrController, 'RewardParamsUpdated')
                    .withArgs([
                        rewardParams.startTime,
                        rewardParams.endTime,
                        rewardParams.startZkpApy,
                        rewardParams.endZkpApy,
                    ]);

                const actualParams = await asrController.rewardParams();

                expect(actualParams.startTime).to.be.eq(rewardParams.startTime);
                expect(actualParams.endTime).to.be.eq(rewardParams.endTime);
                expect(actualParams.startZkpApy).to.be.eq(
                    rewardParams.startZkpApy,
                );
                expect(actualParams.endZkpApy).to.be.eq(rewardParams.endZkpApy);
                expect(actualParams.prpPerStake).to.be.eq(
                    rewardParams.prpPerStake,
                );
            });

            it('should NOT revert if new start APY is equal to new end APY', async () => {
                const rewardParams = {
                    ...getDefaultRewardParams(),
                    startZkpApy: 50,
                    endZkpApy: 50,
                };

                expect(
                    await asrController
                        .connect(owner)
                        .updateRewardParams(rewardParams),
                )
                    .to.emit(asrController, 'RewardParamsUpdated')
                    .withArgs([
                        rewardParams.startTime,
                        rewardParams.endTime,
                        rewardParams.startZkpApy,
                        rewardParams.startZkpApy,
                    ]);
            });
        });

        describe('if called by non-owner', () => {
            it('should revert', async () => {
                await expect(
                    asrController.updateRewardParams(getDefaultRewardParams()),
                ).revertedWith('ImmOwn: unauthorized');
            });
        });
    });

    function generateMessage(
        address: string,
        amount: string,
        stakedAt: string,
        lockedTill: string,
    ) {
        return (
            '0x' +
            address.replace('0x', '') + // staker
            amount.replace('0x', '') + // amount
            '0000002e' + // id
            stakedAt.replace('0x', '') + // stakedAt
            lockedTill.replace('0x', '') + // lockedTill
            '01324649' + // claimedAt
            data.replace('0x', '')
        ).toLowerCase();
    }
});
