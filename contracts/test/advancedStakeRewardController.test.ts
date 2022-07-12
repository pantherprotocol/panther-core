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
    const startApy = 70;
    const endApy = 40;
    const rewardedPeriod = 200;
    const advStake = '0xcc995ce8';
    const asrControllerZkpBalance = BigNumber.from(10).pow(24);
    const asrControllerPrpBalance = BigNumber.from(100000);
    const asrControllerNftBalance = BigNumber.from(10);

    let asrController: MockAdvancedStakeRewardController;
    let zkpToken: TokenMock;
    let nftToken: ERC721Mock;
    let owner: SignerWithAddress;
    let rewardMaster: SignerWithAddress;
    let pantherPool: FakePantherPoolV0;
    let prpGrantor: FakePrpGrantor;
    let start: number;
    let exitTime: number;
    let rewardingStart: number;
    let rewardingEnd: number;
    let prpRewardPerStake: number;
    let snapshotId: number;

    before(async () => {
        start = await getBlockTimestamp();
        rewardingStart = start + 10;
        rewardingEnd = rewardingStart + rewardedPeriod;

        [, owner, rewardMaster] = await ethers.getSigners();

        const ZkpToken = await ethers.getContractFactory('TokenMock');
        zkpToken = (await ZkpToken.connect(owner).deploy()) as TokenMock;

        const NftToken = await ethers.getContractFactory('ERC721Mock');
        nftToken = (await NftToken.connect(owner).deploy()) as ERC721Mock;

        const FakePantherPoolV0 = await ethers.getContractFactory(
            'FakePantherPoolV0',
        );
        exitTime = start + 300;
        pantherPool = (await FakePantherPoolV0.deploy(
            fakeVaultAddress,
            exitTime,
        )) as FakePantherPoolV0;

        const FakePrpGrantor = await ethers.getContractFactory(
            'FakePrpGrantor',
        );
        prpGrantor = (await FakePrpGrantor.deploy()) as FakePrpGrantor;

        prpRewardPerStake = 10000;

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
            rewardingStart,
            rewardedPeriod,
        )) as MockAdvancedStakeRewardController;

        // send some zkpTokens to the AdvancedStakeRewardController contract
        await zkpToken
            .connect(owner)
            .transfer(asrController.address, asrControllerZkpBalance);

        await nftToken
            .connect(owner)
            .mint(asrController.address, asrControllerNftBalance);

        await prpGrantor.issueOwnerGrant(
            asrController.address,
            asrControllerPrpBalance,
        );
    });

    describe('getZkpApyAt (public view)', () => {
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

    describe('_computeZkpReward (internal view)', () => {
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
                // reward shall be the same as for a stake done at rewardingStart ...
                const expReward = getRewardAmount(lockedTill, rewardingStart);
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

                // No rewards for stakes withdrawn on or before the `rewardingStart`
                if (lockedTill <= rewardingStart) return 0;

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

    describe('prepareRewardsLimit (external)', () => {
        beforeEach(async () => {
            snapshotId = await takeSnapshot();

            // Make sure the allowance is not yet set
            expect(
                await zkpToken.allowance(
                    asrController.address,
                    fakeVaultAddress,
                ),
            ).to.be.eq(BigNumber.from(0));
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

        it('should approve the Vault to spend $ZKP balance', async () => {
            await asrController.prepareRewardsLimit();

            expect(
                await zkpToken.allowance(
                    asrController.address,
                    fakeVaultAddress,
                ),
            ).to.be.eq(asrControllerZkpBalance);
        });

        it('should set the Vault as the operator for the NFT', async () => {
            await asrController.prepareRewardsLimit();

            expect(
                await nftToken.isApprovedForAll(
                    asrController.address,
                    fakeVaultAddress,
                ),
            ).to.be.eq(true);
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
                    ethers.utils.hexValue(rewardingStart),
                    ethers.utils.hexValue(rewardingEnd),
                );

                await expect(
                    asrController.internalGenerateRewards(message),
                ).revertedWith('ARC: unexpected zero stakeAmount');
            });

            it('should revert when stake time is greater than lock time', async () => {
                const message = generateMessage(
                    owner.address,
                    '0a0b0c0d0e0f000000ffffff',
                    ethers.utils.hexValue(rewardingEnd),
                    ethers.utils.hexValue(rewardingStart),
                );

                await expect(
                    asrController.internalGenerateRewards(message),
                ).revertedWith('ARC: unexpected lockedTill');
            });

            it('should revert when not enough reward is available', async () => {
                const message = generateMessage(
                    owner.address,
                    '0a0b0c0d0e0f000000ffffff',
                    ethers.utils.hexValue(rewardingStart),
                    ethers.utils.hexValue(rewardingEnd),
                );

                await expect(
                    asrController.internalGenerateRewards(message),
                ).revertedWith('ARC: too less rewards available');
            });
        });

        describe('Generate rewards', () => {
            beforeEach(async () => {
                await asrController.prepareRewardsLimit();

                message = generateMessage(
                    owner.address,
                    amountToStake,
                    ethers.utils.hexValue(rewardingStart),
                    ethers.utils.hexValue(rewardingEnd),
                );

                //? note: In the above message, the stake time is reward start time and lock time is at the end of reward period. The staked amount is 1000e18 ZKP, so the ZKP reward will be (1000e18 * 0.7)  * (200 / 365 * 86400) = 4439370877727042. The scaled staked zkp for each reward is also 1000e18 / 1e15 = 1000e3
            });

            describe('when called for the 1st time', () => {
                it('should emit `RewardGenerated` event w/ expected params', async () => {
                    await expect(asrController.internalGenerateRewards(message))
                        .to.emit(asrController, 'RewardGenerated')
                        .withArgs(
                            owner.address,
                            0,
                            '4439370877727042',
                            prpRewardPerStake,
                            1,
                        );
                });

                checkTotals('1000000', '4439370877727042', 10000, 1);
            });

            describe('when called for the 2nd time', () => {
                it('should emit `RewardGenerated` event w/ expected params', async () => {
                    await expect(asrController.internalGenerateRewards(message))
                        .to.emit(asrController, 'RewardGenerated')
                        .withArgs(
                            owner.address,
                            4,
                            '4439370877727042',
                            prpRewardPerStake,
                            1,
                        );
                });

                checkTotals('2000000', '8878741755454084', 20000, 2);
            });

            describe('when called for the 3rd time', () => {
                it('should emit `RewardGenerated` event w/ expected params', async () => {
                    await expect(asrController.internalGenerateRewards(message))
                        .to.emit(asrController, 'RewardGenerated')
                        .withArgs(
                            owner.address,
                            8,
                            '4439370877727042',
                            prpRewardPerStake,
                            1,
                        );
                });

                checkTotals('3000000', '13318112633181126', 30000, 3);
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
                await increaseTime(90 * 86400);
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
});
