import {ethers} from 'hardhat';
import {BigNumber} from 'ethers';
import {Provider} from '@ethersproject/providers';
import {expect} from 'chai';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/dist/src/signers';
import {FakeContract, smock} from '@defi-wonderland/smock';
import {
    RewardPool,
    IErc20Min,
    RewardMaster,
    IRewardAdviser,
} from '../types/contracts';

describe('Reward Master', () => {
    let rewardPool: FakeContract<RewardPool>;
    let rewardToken: FakeContract<IErc20Min>;
    let rewardAdviser: FakeContract<IRewardAdviser>;
    let rewardMaster: RewardMaster;
    let owner: SignerWithAddress;
    let oracle: SignerWithAddress;
    let user_1: SignerWithAddress;
    let user_2: SignerWithAddress;
    let user_3: SignerWithAddress;
    let user_4: SignerWithAddress;
    let startBlock: number;
    let provider: Provider;

    const getBlockInfo = async (): Promise<{number: number; time: number}> => {
        const blockNumber = (await provider.getBlock('latest')).number;
        const blockTime = (await provider.getBlock('latest')).timestamp;
        return {number: blockNumber, time: blockTime};
    };

    before(async () => {
        [owner, oracle, user_1, user_2, user_3, user_4] =
            await ethers.getSigners();

        rewardPool = await smock.fake('RewardPool');
        rewardToken = await smock.fake('IErc20Min');
        rewardAdviser = await smock.fake('IRewardAdviser');

        provider = ethers.provider;
    });

    const deployRewardMaster = async () => {
        const RewardMaster = await ethers.getContractFactory('RewardMaster');
        rewardMaster = (await RewardMaster.deploy(
            rewardToken.address,
            rewardPool.address,
            owner.address,
        )) as RewardMaster;

        startBlock = (await getBlockInfo()).number;
    };

    describe('public variables', () => {
        before(async () => await deployRewardMaster());

        it('should get the reward pool address', async () => {
            const rewardPoolAddress = await rewardMaster.REWARD_POOL();
            expect(rewardPoolAddress).to.equal(rewardPool.address);
        });

        it('should get the reward token address', async () => {
            const rewardTokenAddress = await rewardMaster.REWARD_TOKEN();
            expect(rewardTokenAddress).to.equal(rewardToken.address);
        });

        it('should get the owner address', async () => {
            const ownerAddress = await rewardMaster.OWNER();
            expect(ownerAddress).to.equal(owner.address);
        });

        it('should get timestamp of start block', async () => {
            const startBlockLocal = await rewardMaster.START_BLOCK();
            expect(startBlockLocal).to.equal(startBlock);
        });

        it('should get the block that contract deployed in', async () => {
            const startBlockLocal = await rewardMaster.START_BLOCK();
            expect(startBlockLocal).to.equal(startBlock);
        });
    });

    describe('Add/Remove advisor', () => {
        const action = ethers.utils.id('STAKE').slice(0, 10); // bytes4

        before(async () => await deployRewardMaster());

        it('should only let owner to add reward adviser', async () => {
            await expect(
                rewardMaster
                    .connect(owner)
                    .addRewardAdviser(
                        oracle.address,
                        action,
                        rewardAdviser.address,
                    ),
            )
                .to.emit(rewardMaster, 'AdviserUpdated')
                .withArgs(oracle.address, action, rewardAdviser.address);

            expect(
                await rewardMaster.rewardAdvisers(oracle.address, action),
            ).to.be.eq(rewardAdviser.address);

            // not-owner
            const nonOwner = (await ethers.getSigners())[1];

            await expect(
                rewardMaster
                    .connect(nonOwner)
                    .addRewardAdviser(
                        oracle.address,
                        action,
                        rewardAdviser.address,
                    ),
            ).revertedWith('ImmOwn: unauthorized');
        });

        it('should only let owner to remove reward advisor', async () => {
            await expect(
                rewardMaster
                    .connect(owner)
                    .removeRewardAdviser(oracle.address, action),
            )
                .to.emit(rewardMaster, 'AdviserUpdated')
                .withArgs(oracle.address, action, ethers.constants.AddressZero);

            expect(
                await rewardMaster.rewardAdvisers(oracle.address, action),
            ).to.be.eq(ethers.constants.AddressZero);

            // not-owner
            const nonOwner = (await ethers.getSigners())[1];

            await expect(
                rewardMaster
                    .connect(nonOwner)
                    .removeRewardAdviser(oracle.address, action),
            ).revertedWith('ImmOwn: unauthorized');
        });
    });

    describe('#onAction()', () => {
        const action = ethers.utils.id('STAKED_OR_UNSTAKED').slice(0, 10); // bytes4
        const message = ethers.utils.id('AN_ENCODED_MESSAGE');
        const vestedRewards = BigNumber.from(10).pow(24); // 1000000e18
        const amountToShareScaledFactor = BigNumber.from(10);
        const shareScale = BigNumber.from(1e3);
        const accumRewardPerShareScale = BigNumber.from(1e9); // hardcoded in RewardMaster

        describe('create shares', () => {
            const amountToStake = BigNumber.from(20).mul(
                BigNumber.from(10).pow(18),
            ); // 20e18: 20 ZKP tokens

            const stakeAdvice = {
                createSharesFor: 'replace_recipient_address_here',
                sharesToCreate: amountToStake
                    .mul(amountToShareScaledFactor)
                    .div(shareScale),
                redeemSharesFrom: ethers.constants.AddressZero,
                sharesToRedeem: BigNumber.from(0),
                sendRewardTo: ethers.constants.AddressZero,
            };

            before(async () => {
                await deployRewardMaster();
                // release rewards to reward master contract
                rewardPool.vestRewards.returns(vestedRewards);
                rewardToken.balanceOf.returns(vestedRewards);

                // add reward advisor
                await rewardMaster
                    .connect(owner)
                    .addRewardAdviser(
                        oracle.address,
                        action,
                        rewardAdviser.address,
                    );
            });

            after(async () => {
                // reset mock
                rewardPool.vestRewards.reset();
                rewardToken.balanceOf.reset();
            });

            it('should grant shares to the first user (user_1)', async () => {
                stakeAdvice.createSharesFor = user_1.address;

                rewardAdviser.adviceReward.returns(stakeAdvice);

                await expect(
                    rewardMaster.connect(oracle).onAction(action, message),
                )
                    .to.emit(rewardMaster, 'SharesGranted')
                    .withArgs(
                        stakeAdvice.createSharesFor,
                        stakeAdvice.sharesToCreate,
                    );

                const {shares, offset} = await rewardMaster.records(
                    stakeAdvice.createSharesFor,
                );

                expect(shares).to.be.eq(stakeAdvice.sharesToCreate);
                expect(offset).to.be.eq(BigNumber.from(0));
                expect(await rewardMaster.totalShares()).to.be.eq(
                    stakeAdvice.sharesToCreate,
                );
                expect(await rewardMaster.lastVestedBlock()).to.be.eq(0);
                expect(await rewardMaster.lastBalance()).to.be.eq(0);
            });

            it('should grant shares to the second user (user_2) and vest tokens to contract', async () => {
                stakeAdvice.createSharesFor = user_2.address;

                rewardAdviser.adviceReward.returns(stakeAdvice);

                const initialTotalShares = await rewardMaster.totalShares();

                await expect(
                    rewardMaster.connect(oracle).onAction(action, message),
                )
                    .to.emit(rewardMaster, 'SharesGranted')
                    .withArgs(
                        stakeAdvice.createSharesFor,
                        stakeAdvice.sharesToCreate,
                    );

                const lastVestedBlock = (await getBlockInfo()).number;

                const {shares, offset} = await rewardMaster.records(
                    stakeAdvice.createSharesFor,
                );

                const accumRewardPerShare = vestedRewards
                    .mul(accumRewardPerShareScale)
                    .div(initialTotalShares);

                expect(shares).to.be.eq(stakeAdvice.sharesToCreate);
                expect(offset).to.be.eq(vestedRewards);
                expect(await rewardMaster.accumRewardPerShare()).to.be.eq(
                    accumRewardPerShare,
                );
                expect(await rewardMaster.totalShares()).to.be.eq(
                    stakeAdvice.sharesToCreate.add(initialTotalShares),
                );
                expect(await rewardMaster.lastVestedBlock()).to.be.eq(
                    lastVestedBlock,
                );
                expect(await rewardMaster.lastBalance()).to.be.eq(
                    vestedRewards,
                );
            });

            it('should grant shares to the third user (user_3) and do not vest token to contract', async () => {
                // resets mock behavior (we do not release token for second time in this test case)
                rewardPool.vestRewards.reset();

                stakeAdvice.createSharesFor = user_3.address;

                rewardAdviser.adviceReward.returns(stakeAdvice);

                const initialTotalShares = await rewardMaster.totalShares();

                await expect(
                    rewardMaster.connect(oracle).onAction(action, message),
                )
                    .to.emit(rewardMaster, 'SharesGranted')
                    .withArgs(
                        stakeAdvice.createSharesFor,
                        stakeAdvice.sharesToCreate,
                    );

                const {shares, offset} = await rewardMaster.records(
                    stakeAdvice.createSharesFor,
                );

                expect(shares).to.be.eq(stakeAdvice.sharesToCreate);
                expect(offset).to.be.eq(vestedRewards);

                expect(await rewardMaster.totalShares()).to.be.eq(
                    stakeAdvice.sharesToCreate.add(initialTotalShares),
                );
                expect(await rewardMaster.lastBalance()).to.be.eq(
                    vestedRewards,
                );
            });

            it('should grant shares to the forth user (user_4) and vest tokens to the contract', async () => {
                rewardPool.vestRewards.returns(vestedRewards);
                rewardToken.balanceOf.returns(vestedRewards.mul(2));

                stakeAdvice.createSharesFor = user_4.address;

                rewardAdviser.adviceReward.returns(stakeAdvice);

                const initialTotalShares = await rewardMaster.totalShares();

                await expect(
                    rewardMaster.connect(oracle).onAction(action, message),
                )
                    .to.emit(rewardMaster, 'SharesGranted')
                    .withArgs(
                        stakeAdvice.createSharesFor,
                        stakeAdvice.sharesToCreate,
                    );

                const {shares, offset} = await rewardMaster.records(
                    stakeAdvice.createSharesFor,
                );

                const accumRewardPerShare =
                    await rewardMaster.accumRewardPerShare();

                expect(shares).to.be.eq(stakeAdvice.sharesToCreate);
                expect(offset).to.be.eq(
                    stakeAdvice.sharesToCreate
                        .mul(accumRewardPerShare)
                        .div(accumRewardPerShareScale),
                );

                expect(await rewardMaster.totalShares()).to.be.eq(
                    stakeAdvice.sharesToCreate.add(initialTotalShares),
                );
                expect(await rewardMaster.lastBalance()).to.be.eq(
                    vestedRewards.mul(2),
                );
            });

            it('should not grant shares if sharesToCreate is 0', async () => {
                const advice = {
                    createSharesFor: user_1.address,
                    sharesToCreate: BigNumber.from(0),
                    redeemSharesFrom: ethers.constants.AddressZero,
                    sharesToRedeem: BigNumber.from(0),
                    sendRewardTo: ethers.constants.AddressZero,
                };
                rewardAdviser.adviceReward.returns(advice);

                const {shares: oldShares, offset: oldOffset} =
                    await rewardMaster.records(advice.createSharesFor);
                const oldTotalShares = await rewardMaster.totalShares();

                await rewardMaster.connect(oracle).onAction(action, message);

                const {shares: newShares, offset: newOffset} =
                    await rewardMaster.records(advice.createSharesFor);
                const newTotalShares = await rewardMaster.totalShares();

                expect(oldShares).to.be.eq(newShares);
                expect(oldOffset).to.be.eq(newOffset);
                expect(oldTotalShares).to.be.eq(newTotalShares);
            });
        });

        describe('redeem shares', () => {
            const amountToStake = BigNumber.from(20).mul(
                BigNumber.from(10).pow(18),
            ); // 20e18: 20 ZKP tokens

            const unstakedAdvice = {
                createSharesFor: ethers.constants.AddressZero,
                sharesToCreate: BigNumber.from(0),
                redeemSharesFrom: 'replace_recipient_address_here',
                sharesToRedeem: amountToStake
                    .mul(amountToShareScaledFactor)
                    .div(shareScale),
                sendRewardTo: 'replace_recipient_address_here',
            };

            before(async () => {
                await deployRewardMaster();

                // release rewards to reward master contract
                rewardPool.vestRewards.returns(vestedRewards);
                rewardToken.transfer.returns(true);

                // add reward advisor
                await rewardMaster
                    .connect(owner)
                    .addRewardAdviser(
                        oracle.address,
                        action,
                        rewardAdviser.address,
                    );

                const stakedAdvice = {
                    createSharesFor: 'replace_recipient_address_here',
                    sharesToCreate: amountToStake
                        .mul(amountToShareScaledFactor)
                        .div(shareScale),
                    redeemSharesFrom: ethers.constants.AddressZero,
                    sharesToRedeem: BigNumber.from(0),
                    sendRewardTo: ethers.constants.AddressZero,
                };

                // create shares for users
                const users = [user_1, user_2, user_3, user_4];
                for (let i = 0; i < users.length; i++) {
                    stakedAdvice.createSharesFor = users[i].address;
                    rewardAdviser.adviceReward.returns(stakedAdvice);

                    rewardToken.balanceOf.returns(vestedRewards.mul(i));

                    await rewardMaster
                        .connect(oracle)
                        .onAction(action, message);
                }

                rewardPool.vestRewards.reset();
            });

            it('should redeem shares of the user who has been granted shares', async () => {
                unstakedAdvice.redeemSharesFrom = user_1.address;
                unstakedAdvice.sendRewardTo = user_1.address;

                rewardAdviser.adviceReward.returns(unstakedAdvice);

                const accumRewardPerShare =
                    await rewardMaster.accumRewardPerShare();

                const totalShares = await rewardMaster.totalShares();
                const oldLastBalance = await rewardMaster.lastBalance();
                const {shares, offset} = await rewardMaster.records(
                    user_1.address,
                );

                const reward = shares
                    .mul(accumRewardPerShare)
                    .div(accumRewardPerShareScale)
                    .sub(offset);

                await expect(
                    rewardMaster.connect(oracle).onAction(action, message),
                )
                    .to.emit(rewardMaster, 'RewardPaid')
                    .withArgs(user_1.address, reward);

                const {shares: updatedShares, offset: updatedOffset} =
                    await rewardMaster.records(user_1.address);
                const lastBalance = await rewardMaster.lastBalance();

                expect(await rewardMaster.totalShares()).to.be.eq(
                    totalShares.sub(shares),
                );
                expect(updatedShares).to.be.eq(BigNumber.from(0));
                expect(updatedOffset).to.be.eq(BigNumber.from(0));
                expect(lastBalance).to.be.eq(oldLastBalance.sub(reward));

                // nobody is sent tokens to contract directly
                rewardToken.balanceOf.returns(lastBalance);
            });

            it('should not redeem shares of the user who has not enough shares', async () => {
                await expect(
                    rewardMaster.connect(oracle).onAction(action, message),
                ).to.be.revertedWith('RM: Not enough shares to redeem');
            });

            it('should redeem part of shares of the user_2 who has been granted shares', async () => {
                unstakedAdvice.redeemSharesFrom = user_2.address;
                unstakedAdvice.sendRewardTo = user_2.address;
                unstakedAdvice.sharesToRedeem = unstakedAdvice.sharesToRedeem
                    .mul(9)
                    .div(10); // 0.9 of the shares

                rewardAdviser.adviceReward.returns(unstakedAdvice);

                const accumRewardPerShare =
                    await rewardMaster.accumRewardPerShare();

                const {shares, offset} = await rewardMaster.records(
                    user_2.address,
                );
                const totalShares = await rewardMaster.totalShares();
                const lastBalance = await rewardMaster.lastBalance();

                const reward = unstakedAdvice.sharesToRedeem
                    .mul(accumRewardPerShare)
                    .div(accumRewardPerShareScale)
                    .sub(offset);

                await expect(
                    rewardMaster.connect(oracle).onAction(action, message),
                )
                    .to.emit(rewardMaster, 'RewardPaid')
                    .withArgs(user_2.address, reward);

                const {shares: updatedShares, offset: updatedOffset} =
                    await rewardMaster.records(user_2.address);

                const updatedLastBalance = await rewardMaster.lastBalance();

                expect(await rewardMaster.totalShares()).to.be.eq(
                    totalShares.sub(unstakedAdvice.sharesToRedeem),
                );
                expect(updatedLastBalance).to.be.eq(lastBalance.sub(reward));
                expect(updatedShares).to.be.eq(
                    shares.sub(unstakedAdvice.sharesToRedeem),
                );
                expect(updatedOffset).to.be.eq(
                    offset.mul(unstakedAdvice.sharesToRedeem).div(shares),
                );

                // nobody is sent tokens to contract directly
                rewardToken.balanceOf.returns(updatedLastBalance);
            });

            it('should redeem the rest of shares of the user_2', async () => {
                const {shares} = await rewardMaster.records(user_2.address);

                unstakedAdvice.redeemSharesFrom = user_2.address;
                unstakedAdvice.sendRewardTo = user_2.address;
                unstakedAdvice.sharesToRedeem = shares;

                rewardAdviser.adviceReward.returns(unstakedAdvice);

                const accumRewardPerShare =
                    await rewardMaster.accumRewardPerShare();

                const totalShares = await rewardMaster.totalShares();
                const lastBalance = await rewardMaster.lastBalance();

                const reward = unstakedAdvice.sharesToRedeem
                    .mul(accumRewardPerShare)
                    .div(accumRewardPerShareScale);

                await expect(
                    rewardMaster.connect(oracle).onAction(action, message),
                )
                    .to.emit(rewardMaster, 'RewardPaid')
                    .withArgs(user_2.address, reward);

                const {shares: updatedShares, offset: updatedOffset} =
                    await rewardMaster.records(user_2.address);

                const updatedLastBalance = await rewardMaster.lastBalance();

                expect(await rewardMaster.totalShares()).to.be.eq(
                    totalShares.sub(unstakedAdvice.sharesToRedeem),
                );
                expect(updatedLastBalance).to.be.eq(lastBalance.sub(reward));
                expect(updatedShares).to.be.eq(
                    shares.sub(unstakedAdvice.sharesToRedeem),
                );
                expect(updatedOffset).to.be.eq(0);

                // nobody is sent tokens to contract directly
                rewardToken.balanceOf.returns(updatedLastBalance);
            });
        });
    });

    describe('#entitled()', async () => {
        const action = ethers.utils.id('STAKED_OR_UNSTAKED').slice(0, 10); // bytes4
        const message = ethers.utils.id('AN_ENCODED_MESSAGE');
        const releasableAmount = BigNumber.from(10).pow(24); // 1000000e18
        const vestedRewards = releasableAmount;
        const amountToStake = BigNumber.from(20).mul(
            BigNumber.from(10).pow(18),
        ); // 20e18: 20 ZKP tokens
        const amountToShareScaledFactor = BigNumber.from(10);
        const shareScale = BigNumber.from(1e3);
        const accumRewardPerShareScale = BigNumber.from(1e9); // hardcoded in RewardMaster

        before(async () => {
            await deployRewardMaster();
            rewardPool.releasableAmount.returns(releasableAmount);

            // add reward advisor
            await rewardMaster
                .connect(owner)
                .addRewardAdviser(
                    oracle.address,
                    action,
                    rewardAdviser.address,
                );

            const stakedAdvice = {
                createSharesFor: 'replace_recipient_address_here',
                sharesToCreate: amountToStake
                    .mul(amountToShareScaledFactor)
                    .div(shareScale),
                redeemSharesFrom: ethers.constants.AddressZero,
                sharesToRedeem: BigNumber.from(0),
                sendRewardTo: ethers.constants.AddressZero,
            };

            // create shares for users
            const users = [user_1, user_2, user_3, user_4];
            for (let i = 0; i < users.length; i++) {
                stakedAdvice.createSharesFor = users[i].address;
                rewardAdviser.adviceReward.returns(stakedAdvice);

                rewardToken.balanceOf.returns(vestedRewards.mul(i));

                await rewardMaster.connect(oracle).onAction(action, message);
            }

            rewardPool.vestRewards.reset();
        });

        it('should returns reward token amount entitled to the user_1 when there is unreleased tokens', async () => {
            const totalShares = await rewardMaster.totalShares();
            const accumRewardPerShare =
                await rewardMaster.accumRewardPerShare();

            const newAccumRewardPerShare = accumRewardPerShare.add(
                releasableAmount.mul(accumRewardPerShareScale).div(totalShares),
            );

            const {shares, offset} = await rewardMaster.records(user_1.address);

            const reward = shares
                .mul(newAccumRewardPerShare)
                .div(accumRewardPerShareScale)
                .sub(offset);

            const entitled = await rewardMaster.entitled(user_1.address);

            expect(entitled).to.be.eq(reward);
        });

        it('should returns reward token amount entitled to the user_1 when all vested tokens are released', async () => {
            rewardPool.releasableAmount.returns(0);

            const accumRewardPerShare =
                await rewardMaster.accumRewardPerShare();

            const {shares, offset} = await rewardMaster.records(user_1.address);

            const reward = shares
                .mul(accumRewardPerShare)
                .div(accumRewardPerShareScale)
                .sub(offset);

            const entitled = await rewardMaster.entitled(user_1.address);

            expect(entitled).to.be.eq(reward);
        });

        it('should returns 0 if user does not have shares', async () => {
            const entitled = await rewardMaster.entitled(owner.address);

            expect(entitled).to.be.eq(0);
        });
    });

    describe('#claimErc20()', async () => {
        const action = ethers.utils.id('STAKED_OR_UNSTAKED').slice(0, 10); // bytes4
        const message = ethers.utils.id('AN_ENCODED_MESSAGE');

        before(async () => await deployRewardMaster());

        it('should not let admin withdraw reward tokens from contract when there are some shares', async () => {
            // create shares for users
            await rewardMaster
                .connect(owner)
                .addRewardAdviser(
                    oracle.address,
                    action,
                    rewardAdviser.address,
                );

            // create shares for users
            rewardAdviser.adviceReward.returns({
                createSharesFor: user_1.address,
                sharesToCreate: BigNumber.from(1000),
                redeemSharesFrom: ethers.constants.AddressZero,
                sharesToRedeem: BigNumber.from(0),
                sendRewardTo: ethers.constants.AddressZero,
            });

            await rewardMaster.connect(oracle).onAction(action, message);

            await expect(
                rewardMaster
                    .connect(owner)
                    .claimErc20(rewardToken.address, owner.address, 1),
            ).to.be.revertedWith('RM: Failed to claim');
        });
    });
});
