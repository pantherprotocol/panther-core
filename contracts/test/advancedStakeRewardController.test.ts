import {
    increaseTime,
    mineBlock,
    revertSnapshot,
    takeSnapshot,
} from '../lib/hardhat';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/dist/src/signers';
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
} from '../types/contracts';
import {getBlockTimestamp} from '../lib/provider';

describe('AdvancedStakeRewardController', () => {
    const fakeVaultAddress = '0x4321555555555555555555555555555555551234';
    const rewardedPeriod = 200;
    const prpRewardPerStake = 10000;
    const advStake = '0xcc995ce8';
    const asrControllerZkpBalance = BigNumber.from(10).pow(24);
    const asrControllerPrpBalance = BigNumber.from(100000);
    const asrControllerNftRewardsLimit = BigNumber.from(10);

    let asrController: MockAdvancedStakeRewardController;
    let zkpToken: TokenMock;
    let nftToken: ERC721Mock;
    let owner: SignerWithAddress;
    let rewardMaster: SignerWithAddress;
    let pantherPool: FakePantherPoolV0;
    let prpGrantor: FakePrpGrantor;
    let start: number;
    let rewardingStartTime: number;
    let rewardingEndTime: number;
    let rewardingStartApy: number;
    let rewardingEndApy: number;
    let scApyDropPerSecond: BigNumber;
    let snapshotId: number;

    before(async () => {
        start = await getBlockTimestamp();
        rewardingStartTime = start + 10;
        rewardingEndTime = rewardingStartTime + rewardedPeriod;
        rewardingStartApy = 70;
        rewardingEndApy = 40;

        scApyDropPerSecond = BigNumber.from(rewardingStartApy - rewardingEndApy)
            .mul(1e9)
            .div(rewardedPeriod);

        [, owner, rewardMaster] = await ethers.getSigners();

        const ZkpToken = await ethers.getContractFactory('TokenMock');
        zkpToken = (await ZkpToken.connect(owner).deploy()) as TokenMock;

        const NftToken = await ethers.getContractFactory('ERC721Mock');
        nftToken = (await NftToken.connect(owner).deploy()) as ERC721Mock;

        const FakePantherPoolV0 = await ethers.getContractFactory(
            'FakePantherPoolV0',
        );
        const exitTime = start + 300;
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
            prpRewardPerStake,
            rewardingStartTime,
            rewardingEndTime,
            rewardingStartApy,
            rewardingEndApy,
        )) as MockAdvancedStakeRewardController;

        // send some zkpTokens to the AdvancedStakeRewardController contract
        await zkpToken
            .connect(owner)
            .transfer(asrController.address, asrControllerZkpBalance);

        await prpGrantor.issueOwnerGrant(
            asrController.address,
            asrControllerPrpBalance,
        );
    });

    describe('getZkpApyAt (public view)', () => {
        let rewardParams: {
            startTime: number;
            endTime: number;
            startApy: number;
            endApy: number;
        };

        before(() => {
            rewardParams = {
                startTime: rewardingStartTime,
                endTime: rewardingEndTime,
                startApy: rewardingStartApy,
                endApy: rewardingEndApy,
            };
        });

        it('should return 0 if the given `endTime` is less than given `startTime`', async () => {
            const invalidRewardParams = {
                ...rewardParams,
                endTime: rewardingStartTime - 1,
            };

            expect(
                await asrController.getZkpApyAt(
                    invalidRewardParams,
                    rewardingStartTime,
                ),
            ).to.eq(0);
        });

        it('should return 0 if called before `rewardingStartTime`', async () => {
            expect(
                await asrController.getZkpApyAt(
                    rewardParams,
                    rewardingStartTime - 5,
                ),
            ).to.eq(0);
        });

        it('should return `rewardingStartApy` if called on `rewardingStartTime`', async () => {
            expect(
                await asrController.getZkpApyAt(
                    rewardParams,
                    rewardingStartTime,
                ),
            ).to.eq(rewardingStartApy);
        });

        it('should return `rewardingEndApy` if called on `rewardingEndTime`', async () => {
            expect(
                await asrController.getZkpApyAt(rewardParams, rewardingEndTime),
            ).to.eq(rewardingEndApy);
        });

        it('should return `rewardingEndApy` if called after `rewardingEndTime`', async () => {
            expect(
                await asrController.getZkpApyAt(
                    rewardParams,
                    rewardingEndTime + 100,
                ),
            ).to.eq(rewardingEndApy);
        });

        it('should return `startApy-(startApy-endApy)/4` if called at `startTime+rewardedPeriod/4`', async () => {
            const scaledApyDrop = BigNumber.from(
                rewardingStartApy - rewardingEndApy,
            )
                .mul(1e9)
                .div(4);
            const expApy =
                rewardingStartApy - scaledApyDrop.div(1e9).toNumber();
            expect(
                await asrController.getZkpApyAt(
                    rewardParams,
                    parseInt(`${rewardingStartTime + rewardedPeriod / 4}`),
                ),
            ).to.eq(expApy);
        });

        it('should return `startApy-(startApy-endApy)*3/4` if called at `startTime+rewardedPeriod*3/4`', async () => {
            const scaledApyDrop = BigNumber.from(
                rewardingStartApy - rewardingEndApy,
            )
                .mul(3e9)
                .div(4);
            const expApy =
                rewardingStartApy - scaledApyDrop.div(1e9).toNumber();
            expect(
                await asrController.getZkpApyAt(
                    rewardParams,
                    parseInt(
                        `${rewardingStartTime + (rewardedPeriod * 3) / 4}`,
                    ),
                ),
            ).to.eq(expApy);
        });
    });

    describe('_computeZkpReward (internal view)', () => {
        describe('for a deposit of 0 (zero $ZKPs staked)', () => {
            const stakedAmount = BigNumber.from(0);

            it('should return 0 if called w/ `lockedTill` before `rewardingStartTime`', async () => {
                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        start + 2, // lockedTill
                        start, // stakedAt
                    ),
                ).to.eq(0);
            });

            it('should return 0 if called w/ `stakedAt` at `rewardingStartTime+rewardedPeriod/2`', async () => {
                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        rewardingStartTime + rewardedPeriod / 2 + 10, // lockedTill
                        rewardingStartTime + rewardedPeriod / 2, // stakedAt
                    ),
                ).to.eq(0);
            });

            it('should return 0 if called w/ `stakedAt` after `rewardingEndTime`', async () => {
                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        rewardingEndTime + 10, // lockedTill
                        rewardingEndTime + 5, // stakedAt
                    ),
                ).to.eq(0);
            });
        });

        describe('for a deposit of 1e3 $ZKP', () => {
            const stakedAmount = BigNumber.from(1e9).mul(1e12);

            it('should return 0 if called w/ `lockedTill` before `rewardingStartTime`', async () => {
                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        rewardingStartTime - 5, // lockedTill
                        rewardingStartTime - 10, // stakedAt
                    ),
                ).to.eq(0);
            });

            it('should return zero amount if called w/ `stakedAt` after `rewardingEndTime`', async () => {
                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        rewardingEndTime + 10, // lockedTill
                        rewardingEndTime + 5, // stakedAt
                    ),
                ).to.eq(0);
            });

            describe('when `stakedAt` is `rewardingStartTime` and `lockedTill` equals to `rewardingEndTime`', () => {
                it('should return the expected reward amount', async () => {
                    const expReward = stakedAmount
                        .mul(rewardingStartApy)
                        .mul(rewardedPeriod)
                        .div(365 * 86400 * 100);

                    expect(
                        await asrController.internalComputeZkpReward(
                            stakedAmount,
                            rewardingEndTime, // lockedTill
                            rewardingStartTime, // stakedAt
                        ),
                    ).to.eq(expReward);
                });
            });
        });

        describe('for predefined test cases', () => {
            const stakedAmount = BigNumber.from(33277).mul(1e14); // 3.3277 $ZKP

            it('should return the expected reward amount for the case 1', async () => {
                // Staked after the `rewardingStartTime`, till before the `rewardingEndTime`
                const stakedAt = rewardingStartTime + 23;
                const lockedTill = rewardingStartTime + rewardedPeriod / 2;
                const expReward = getRewardAmount(lockedTill, stakedAt);

                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        lockedTill,
                        stakedAt,
                    ),
                ).to.eq(expReward);
            });

            it('should return the expected reward amount for the case 2', async () => {
                // Staked before the `rewardingStartTime`, till before the `rewardingStartTime`
                const stakedAt = rewardingStartTime - 4;
                const lockedTill = rewardingStartTime - 1;
                const expReward = getRewardAmount(lockedTill, stakedAt);

                // no rewards before the `rewardingStartTime`
                assert(expReward.toString() == '0');

                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        lockedTill,
                        stakedAt,
                    ),
                ).to.eq(expReward);
            });

            it('should return the expected reward amount for the case 3', async () => {
                // Staked before the `rewardingStartTime`, till on the `rewardingStartTime`
                const stakedAt = rewardingStartTime - 4;
                const lockedTill = rewardingStartTime;
                const expReward = getRewardAmount(lockedTill, stakedAt);

                // no rewards before the `rewardingStartTime`
                assert(expReward.toString() == '0');

                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        lockedTill,
                        stakedAt,
                    ),
                ).to.eq(expReward);
            });

            it('should return the expected reward amount for the case 4', async () => {
                // Staked before the `rewardingStartTime`, till before the `rewardingEndTime`
                const stakedAt = rewardingStartTime - 4;
                const lockedTill = rewardingStartTime + rewardedPeriod / 2;
                // reward shall be the same as for a stake done at rewardingStartTime ...
                const expReward = getRewardAmount(
                    lockedTill,
                    rewardingStartTime,
                );
                // ... and it shall not be 0
                assert(BigNumber.from(expReward).gt(0));

                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        lockedTill,
                        stakedAt,
                    ),
                ).to.eq(expReward);
            });

            it('should return the expected reward amount for the case 5', async () => {
                // Staked on the `rewardingStartTime`, till before the `rewardingEndTime`
                const stakedAt = rewardingStartTime;
                const lockedTill = rewardingStartTime + rewardedPeriod / 2;
                const expReward = getRewardAmount(lockedTill, stakedAt);

                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        lockedTill,
                        stakedAt,
                    ),
                ).to.eq(expReward);
            });

            it('should return the expected reward amount for the case 6', async () => {
                // Staked after the `rewardingStartTime`, till before the `rewardingEndTime`
                const stakedAt = rewardingStartTime + 10;
                const lockedTill = rewardingStartTime + rewardedPeriod / 2;
                const expReward = getRewardAmount(lockedTill, stakedAt);

                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        lockedTill,
                        stakedAt,
                    ),
                ).to.eq(expReward);
            });

            it('should return the expected reward amount for the case 7', async () => {
                // Staked after the `rewardingStartTime`, till after the `rewardingEndTime`
                const stakedAt = rewardingStartTime + 10;
                const lockedTill =
                    rewardingStartTime + rewardedPeriod / 2 + 300;
                const expReward = getRewardAmount(lockedTill, stakedAt);

                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        lockedTill,
                        stakedAt,
                    ),
                ).to.eq(expReward);
            });

            it('should return the expected reward amount for the case 8', async () => {
                // Staked on the `rewardingEndTime`, till after that
                const stakedAt = rewardingEndTime;
                const lockedTill = rewardingEndTime + 300;
                const expReward = getRewardAmount(lockedTill, stakedAt);

                // no rewards on and after the `rewardingEndTime`
                assert(expReward.toString() == '0');

                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        lockedTill,
                        stakedAt,
                    ),
                ).to.eq(expReward);
            });

            it('should return the expected reward amount for the case 9', async () => {
                // Staked after the `rewardingEndTime`, till even later
                const stakedAt = rewardingEndTime + 10;
                const lockedTill = rewardingEndTime + 300;
                const expReward = getRewardAmount(lockedTill, stakedAt);

                // no rewards after the `rewardingEndTime`
                assert(expReward.toString() == '0');

                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        lockedTill,
                        stakedAt,
                    ),
                ).to.eq(expReward);
            });

            function getRewardAmount(lockedTill: number, stakedAt: number) {
                assert(lockedTill > stakedAt);

                // No rewards for stakes withdrawn on or before the `rewardingStartTime`
                if (lockedTill <= rewardingStartTime) return 0;

                // No rewards for stakes made on or after the `rewardingEndTime`
                if (stakedAt >= rewardingEndTime) return 0;

                const rewardedSince =
                    stakedAt >= rewardingStartTime
                        ? stakedAt
                        : rewardingStartTime;
                const rewardedTill =
                    lockedTill >= rewardingEndTime
                        ? rewardingEndTime
                        : lockedTill;
                const rewardedPeriod = rewardedTill - rewardedSince;
                if (rewardedPeriod == 0) return 0;

                const scaledApyDrop = scApyDropPerSecond.mul(
                    stakedAt - rewardingStartTime,
                );
                const apy =
                    rewardingStartApy - scaledApyDrop.div(1e9).toNumber();

                return stakedAmount
                    .mul(apy)
                    .mul(rewardedPeriod)
                    .div(365 * 24 * 3600 * 100);
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
            snapshotId = await takeSnapshot();

            // Make sure the allowance is not yet set
            expect(
                await zkpToken.allowance(
                    asrController.address,
                    fakeVaultAddress,
                ),
            ).to.be.eq(BigNumber.from(0));
        });

        afterEach(async () => {
            await revertSnapshot(snapshotId);
        });

        it('should update the PRP reward limits', async () => {
            await asrController.updateZkpAndPrpRewardsLimit();

            expect((await asrController.limits()).prpRewards).to.be.eq(
                asrControllerPrpBalance,
            );
        });

        it('should update the ZKP reward limits and approve the Vault to spend $ZKP balance', async () => {
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
            snapshotId = await takeSnapshot();

            assert(
                !(await nftToken.isApprovedForAll(
                    asrController.address,
                    fakeVaultAddress,
                )),
            );
        });

        afterEach(async () => {
            await revertSnapshot(snapshotId);
        });

        describe('if called by the owner', () => {
            it('should update the NFT rewards limit and set the Vault as the operator', async () => {
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
        const amountToStake = ethers.utils.hexZeroPad(
            ethers.utils.parseEther('1000').toHexString(),
            12,
        );

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

        function checkTotals(
            scZkpStaked: BigNumberish,
            zkpRewards: BigNumberish,
            prpRewards: BigNumberish,
            nftRewards: BigNumberish,
        ) {
            it('should return expected total (scaled) amount of $ZKPs staked so far', async () => {
                expect((await asrController.totals()).scZkpStaked).to.be.eq(
                    BigNumber.from(scZkpStaked),
                );
            });

            it('should return expected total amount of $ZKPs rewarded so far', async () => {
                expect((await asrController.totals()).zkpRewards).to.be.eq(
                    BigNumber.from(zkpRewards),
                );
            });
            it('should return expected total amount of PRPs rewarded so far', async () => {
                expect((await asrController.totals()).prpRewards).to.be.eq(
                    prpRewards,
                );
            });

            it('should return expected total number of NFTs rewarded so far', async () => {
                expect((await asrController.totals()).nftRewards).to.be.eq(
                    nftRewards,
                );
            });
        }

        before(async () => {
            snapshotId = await takeSnapshot();
        });

        after(async () => {
            await revertSnapshot(snapshotId);
        });

        describe('Failure', () => {
            it('should revert when stake amount is 0', async () => {
                const message = generateMessage(
                    owner.address,
                    '000000000000000000000000',
                    ethers.utils.hexValue(rewardingStartTime),
                    ethers.utils.hexValue(rewardingEndTime),
                );

                await expect(
                    asrController.internalGenerateRewards(message),
                ).revertedWith('ARC: unexpected zero stakeAmount');
            });

            it('should revert when stake time is greater than lock time', async () => {
                const message = generateMessage(
                    owner.address,
                    '0a0b0c0d0e0f000000ffffff',
                    ethers.utils.hexValue(rewardingEndTime),
                    ethers.utils.hexValue(rewardingStartTime),
                );

                await expect(
                    asrController.internalGenerateRewards(message),
                ).revertedWith('ARC: unexpected lockedTill');
            });

            it('should revert when not enough reward is available', async () => {
                const message = generateMessage(
                    owner.address,
                    '0a0b0c0d0e0f000000ffffff',
                    ethers.utils.hexValue(rewardingStartTime),
                    ethers.utils.hexValue(rewardingEndTime),
                );

                await expect(
                    asrController.internalGenerateRewards(message),
                ).revertedWith('ARC: too less rewards available');
            });
        });

        describe('Generate rewards', () => {
            // amountToStake * rewardingStartApy *  rewardedPeriod / 100 / 365 / 86400
            const expectedZkpReward = 4439370877727042;
            // 1000e18 / 1e15
            const expectedScZkpStaked = 1000e3;

            beforeEach(async () => {
                await asrController.updateZkpAndPrpRewardsLimit();
                await asrController
                    .connect(owner)
                    .setNftRewardLimit(asrControllerNftRewardsLimit);

                message = generateMessage(
                    owner.address,
                    amountToStake,
                    ethers.utils.hexValue(rewardingStartTime),
                    ethers.utils.hexValue(rewardingEndTime),
                );
            });

            describe('when called for the 1st time', () => {
                it('should emit `RewardGenerated` event w/ expected params', async () => {
                    await expect(asrController.internalGenerateRewards(message))
                        .to.emit(asrController, 'RewardGenerated')
                        .withArgs(
                            owner.address,
                            0,
                            expectedZkpReward,
                            prpRewardPerStake,
                            1,
                        );
                });

                checkTotals(
                    expectedScZkpStaked,
                    expectedZkpReward,
                    prpRewardPerStake,
                    1,
                );
            });

            describe('when called for the 2nd time', () => {
                it('should emit `RewardGenerated` event w/ expected params', async () => {
                    await expect(asrController.internalGenerateRewards(message))
                        .to.emit(asrController, 'RewardGenerated')
                        .withArgs(
                            owner.address,
                            4,
                            expectedZkpReward,
                            prpRewardPerStake,
                            1,
                        );
                });

                checkTotals(
                    expectedScZkpStaked * 2,
                    expectedZkpReward * 2,
                    prpRewardPerStake * 2,
                    2,
                );
            });

            describe('when called for the 3rd time', () => {
                it('should emit `RewardGenerated` event w/ expected params', async () => {
                    await expect(asrController.internalGenerateRewards(message))
                        .to.emit(asrController, 'RewardGenerated')
                        .withArgs(
                            owner.address,
                            8,
                            expectedZkpReward,
                            prpRewardPerStake,
                            1,
                        );
                });

                checkTotals(
                    expectedScZkpStaked * 3,
                    BigNumber.from(expectedZkpReward).mul(3).toString(),
                    prpRewardPerStake * 3,
                    3,
                );
            });
        });
    });

    describe('getRewardAdvice (external)', () => {
        beforeEach(async () => {
            snapshotId = await takeSnapshot();
        });

        afterEach(async () => {
            await revertSnapshot(snapshotId);
        });

        describe('Failure', () => {
            it('should revert when caller is not reward master', async () => {
                await expect(
                    asrController.getRewardAdvice(advStake, '0x00'),
                ).to.revertedWith('ARC: unauthorized');
            });

            it('should revert when stake action is invalid', async () => {
                await expect(
                    asrController
                        .connect(rewardMaster)
                        .getRewardAdvice('0x00000000', '0x00'),
                ).to.revertedWith('ARC: unsupported action');
            });
        });
    });

    describe('rescueErc20 (external)', () => {
        beforeEach(async () => {
            snapshotId = await takeSnapshot();
        });

        afterEach(async () => {
            await revertSnapshot(snapshotId);
        });
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
                // fast forward to forbidden period
                await increaseTime(90 * 86400 + 100);
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
        before(async () => {
            rewardingStartTime = (await getBlockTimestamp()) + 100;
            rewardingEndTime = rewardingStartTime + rewardedPeriod;
            rewardingStartApy = 50;
            rewardingEndApy = 30;
        });

        describe('if new rewarding parameters are invalid', () => {
            it('should revert when new start time is less than current one', async () => {
                await expect(
                    asrController
                        .connect(owner)
                        .updateRewardParams(
                            rewardingStartTime - 100,
                            rewardingEndTime,
                            rewardingStartApy,
                            rewardingEndApy,
                        ),
                ).revertedWith('ARC: invalid time');
            });

            it('should revert when new end time is less than or equal to new start time', async () => {
                await expect(
                    asrController
                        .connect(owner)
                        .updateRewardParams(
                            rewardingStartTime,
                            rewardingStartTime,
                            rewardingStartApy,
                            rewardingEndApy,
                        ),
                ).revertedWith('ARC: invalid time');
            });

            it('should revert when new start APY is greater than 100', async () => {
                await expect(
                    asrController
                        .connect(owner)
                        .updateRewardParams(
                            rewardingStartTime,
                            rewardingEndTime,
                            101,
                            rewardingEndApy,
                        ),
                ).revertedWith('ARC: invalid APY');
            });

            it('should revert when new start APY is less than new end APY', async () => {
                await expect(
                    asrController
                        .connect(owner)
                        .updateRewardParams(
                            rewardingStartTime,
                            rewardingEndTime,
                            50,
                            60,
                        ),
                ).revertedWith('ARC: invalid APY');
            });
        });

        describe('if called by owner', () => {
            it('should update the times and APYs', async () => {
                expect(
                    await asrController
                        .connect(owner)
                        .updateRewardParams(
                            rewardingStartTime,
                            rewardingEndTime,
                            rewardingStartApy,
                            rewardingEndApy,
                        ),
                )
                    .to.emit(asrController, 'RewardParamsUpdated')
                    .withArgs([
                        rewardingStartTime,
                        rewardingEndTime,
                        rewardingStartApy,
                        rewardingEndApy,
                    ]);

                expect((await asrController.rewardParams()).startTime).to.be.eq(
                    rewardingStartTime,
                );
                expect((await asrController.rewardParams()).endTime).to.be.eq(
                    rewardingEndTime,
                );
                expect((await asrController.rewardParams()).startApy).to.be.eq(
                    rewardingStartApy,
                );
                expect((await asrController.rewardParams()).endApy).to.be.eq(
                    rewardingEndApy,
                );
            });
        });

        describe('if called by non-owner', () => {
            it('should revert', async () => {
                await expect(
                    asrController.updateRewardParams(
                        rewardingStartTime,
                        rewardingEndTime,
                        rewardingStartApy,
                        rewardingEndApy,
                    ),
                ).revertedWith('ImmOwn: unauthorized');
            });
        });
    });
});
