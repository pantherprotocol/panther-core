import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/dist/src/signers';
import {ethers} from 'hardhat';
import {assert, expect} from 'chai';
import {BigNumber} from 'ethers';

import {
    FakePantherPoolV0,
    MockAdvancedStakeRewardController,
    TokenMock,
} from '../types/contracts';
import {getBlockTimestamp} from '../lib/provider';

describe('AdvancedStakeRewardController', () => {
    const fakeVaultAddress = '0x4321555555555555555555555555555555551234';
    const startApy = 70;
    const endApy = 40;
    const rewardedPeriod = 200;

    let asrController: MockAdvancedStakeRewardController;
    let zkpToken: TokenMock;
    // let nftToken: TokenMock;
    let owner: SignerWithAddress;
    let rewardMaster: SignerWithAddress;
    let pantherPool: FakePantherPoolV0;
    let start: number;
    let exitTime: number;
    let rewardingStart: number;
    let rewardingEnd: number;

    before(async () => {
        start = await getBlockTimestamp();
        rewardingStart = start + 10;
        rewardingEnd = rewardingStart + rewardedPeriod;

        [, owner, rewardMaster] = await ethers.getSigners();

        const Token = await ethers.getContractFactory('TokenMock');
        zkpToken = (await Token.connect(owner).deploy()) as TokenMock;

        const FakePantherPoolV0 = await ethers.getContractFactory(
            'FakePantherPoolV0',
        );
        exitTime = start + 300;
        pantherPool = (await FakePantherPoolV0.deploy(
            fakeVaultAddress,
            exitTime,
        )) as FakePantherPoolV0;

        const MockAdvancedStakeRewardController =
            await ethers.getContractFactory(
                'MockAdvancedStakeRewardController',
            );
        asrController = (await MockAdvancedStakeRewardController.deploy(
            owner.address,
            rewardMaster.address,
            pantherPool.address,
            zkpToken.address,
            ethers.constants.AddressZero, // nftToken
            rewardingStart,
            rewardedPeriod,
        )) as MockAdvancedStakeRewardController;

        // send some zkpTokens to the AdvancedStakeRewardController contract
        const asrControllerBalance = BigNumber.from(10).pow(24);
        await zkpToken
            .connect(owner)
            .transfer(asrController.address, asrControllerBalance);
    });

    describe('getZkpApyAt', () => {
        it('should return 0 if called before `rewardingStart`', async () => {
            expect(await asrController.getZkpApyAt(rewardingStart - 5)).to.eq(
                0,
            );
        });

        it('should return `startApy` if called on `rewardingStart`', async () => {
            expect(await asrController.getZkpApyAt(rewardingStart)).to.eq(
                startApy,
            );
        });

        it('should return `endApy` if called on `rewardingEnd`', async () => {
            expect(await asrController.getZkpApyAt(rewardingEnd)).to.eq(endApy);
        });

        it('should return `endApy` if called after `rewardingEnd`', async () => {
            expect(await asrController.getZkpApyAt(rewardingEnd + 100)).to.eq(
                endApy,
            );
        });

        it('should return `startApy-(startApy-endApy)/4` if called at `rewardingStart+rewardedPeriod/4`', async () => {
            const scaledApyDrop = BigNumber.from(startApy - endApy)
                .mul(1e9)
                .div(4);
            const expApy = startApy - scaledApyDrop.div(1e9).toNumber();
            expect(
                await asrController.getZkpApyAt(
                    parseInt(`${rewardingStart + rewardedPeriod / 4}`),
                ),
            ).to.eq(expApy);
        });

        it('should return `startApy-(startApy-endApy)*3/4` if called at `rewardingStart+rewardedPeriod*3/4`', async () => {
            const scaledApyDrop = BigNumber.from(startApy - endApy)
                .mul(3e9)
                .div(4);
            const expApy = startApy - scaledApyDrop.div(1e9).toNumber();
            expect(
                await asrController.getZkpApyAt(
                    parseInt(`${rewardingStart + (rewardedPeriod * 3) / 4}`),
                ),
            ).to.eq(expApy);
        });
    });

    describe('internal _generateRewards', () => {
        describe('for a deposit of 0 (zero $ZKPs staked)', () => {
            const stakedAmount = BigNumber.from(0);

            it('should return 0 if called w/ `lockedTill` before `rewardingStart`', async () => {
                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        start + 2, // lockedTill
                        start, // stakedAt
                    ),
                ).to.eq(0);
            });

            it('should return 0 if called w/ `stakedAt` at `rewardingStart+rewardedPeriod/2`', async () => {
                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        rewardingStart + rewardedPeriod / 2 + 10, // lockedTill
                        rewardingStart + rewardedPeriod / 2, // stakedAt
                    ),
                ).to.eq(0);
            });

            it('should return 0 if called w/ `stakedAt` after `rewardingEnd`', async () => {
                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        rewardingEnd + 10, // lockedTill
                        rewardingEnd + 5, // stakedAt
                    ),
                ).to.eq(0);
            });
        });

        describe('for a deposit of 1e3 $ZKP', () => {
            const stakedAmount = BigNumber.from(1e9).mul(1e12);

            it('should return 0 if called w/ `lockedTill` before `rewardingStart`', async () => {
                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        rewardingStart - 5, // lockedTill
                        rewardingStart - 10, // stakedAt
                    ),
                ).to.eq(0);
            });

            it('should return zero amount if called w/ `stakedAt` after `rewardingEnd`', async () => {
                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        rewardingEnd + 10, // lockedTill
                        rewardingEnd + 5, // stakedAt
                    ),
                ).to.eq(0);
            });

            describe('when `stakedAt` is `rewardingStart` and `lockedTill` equals to `rewardingEnd`', () => {
                it('should return the expected reward amount', async () => {
                    const expReward = stakedAmount
                        .mul(startApy)
                        .mul(rewardedPeriod)
                        .div(365 * 86400 * 100);

                    expect(
                        await asrController.internalComputeZkpReward(
                            stakedAmount,
                            rewardingEnd, // lockedTill
                            rewardingStart, // stakedAt
                        ),
                    ).to.eq(expReward);
                });
            });
        });

        describe('for predefined test cases', () => {
            const stakedAmount = BigNumber.from(33277).mul(1e14); // 3.3277 $ZKP
            const scApyDropPerSecond = BigNumber.from(startApy - endApy)
                .mul(1e9)
                .div(rewardedPeriod);

            it('should return the expected reward amount for the case 1', async () => {
                // Staked after the `rewardingStart`, till before the `rewardingEnd`
                const stakedAt = rewardingStart + 23;
                const lockedTill = rewardingStart + rewardedPeriod / 2;
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
                // Staked before the `rewardingStart`, till before the `rewardingStart`
                const stakedAt = rewardingStart - 4;
                const lockedTill = rewardingStart - 1;
                const expReward = getRewardAmount(lockedTill, stakedAt);

                // no rewards before the `rewardingStart`
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
                // Staked before the `rewardingStart`, till on the `rewardingStart`
                const stakedAt = rewardingStart - 4;
                const lockedTill = rewardingStart;
                const expReward = getRewardAmount(lockedTill, stakedAt);

                // no rewards before the `rewardingStart`
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
                // Staked before the `rewardingStart`, till before the `rewardingEnd`
                const stakedAt = rewardingStart - 4;
                const lockedTill = rewardingStart + rewardedPeriod / 2;
                const expReward = getRewardAmount(lockedTill, stakedAt);

                // no rewards before the `rewardingStart`
                assert(expReward.toString() == '0');

                expect(
                    await asrController.internalComputeZkpReward(
                        stakedAmount,
                        lockedTill,
                        stakedAt,
                    ),
                ).to.eq(expReward);
            });

            it('should return the expected reward amount for the case 5', async () => {
                // Staked on the `rewardingStart`, till before the `rewardingEnd`
                const stakedAt = rewardingStart;
                const lockedTill = rewardingStart + rewardedPeriod / 2;
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
                // Staked after the `rewardingStart`, till before the `rewardingEnd`
                const stakedAt = rewardingStart + 10;
                const lockedTill = rewardingStart + rewardedPeriod / 2;
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
                // Staked after the `rewardingStart`, till after the `rewardingEnd`
                const stakedAt = rewardingStart + 10;
                const lockedTill = rewardingStart + rewardedPeriod / 2 + 300;
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
                // Staked on the `rewardingEnd`, till after that
                const stakedAt = rewardingEnd;
                const lockedTill = rewardingEnd + 300;
                const expReward = getRewardAmount(lockedTill, stakedAt);

                // no rewards on and after the `rewardingEnd`
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
                // Staked after the `rewardingEnd`, till even later
                const stakedAt = rewardingEnd + 10;
                const lockedTill = rewardingEnd + 300;
                const expReward = getRewardAmount(lockedTill, stakedAt);

                // no rewards after the `rewardingEnd`
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

                // No rewards for stakes made before the `rewardingStart`
                if (stakedAt < rewardingStart) return 0;

                // No rewards for stakes made on or after the `rewardingEnd`
                if (stakedAt >= rewardingEnd) return 0;

                const rewardedSince =
                    stakedAt >= rewardingStart ? stakedAt : rewardingStart;
                const rewardedTill =
                    lockedTill >= rewardingEnd ? rewardingEnd : lockedTill;
                const rewardedPeriod = rewardedTill - rewardedSince;
                if (rewardedPeriod == 0) return 0;

                const scaledApyDrop = scApyDropPerSecond.mul(
                    stakedAt - rewardingStart,
                );
                const apy = startApy - scaledApyDrop.div(1e9).toNumber();

                return stakedAmount
                    .mul(apy)
                    .mul(rewardedPeriod)
                    .div(365 * 24 * 3600 * 100);
            }
        });
    });
});
