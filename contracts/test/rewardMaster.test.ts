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

describe.only('Reward Master', () => {
    let rewardPool: FakeContract<RewardPool>;
    let rewardToken: FakeContract<IErc20Min>;
    let rewardAdviser: FakeContract<IRewardAdviser>;
    let rewardMaster: RewardMaster;
    let owner: SignerWithAddress;
    let oracle: SignerWithAddress;
    let user_1: SignerWithAddress;
    let user_2: SignerWithAddress;
    let user_3: SignerWithAddress;
    let startBlock: number;
    let provider: Provider;

    const getBlockInfo = async (): Promise<{number: number; time: number}> => {
        const blockNumber = (await provider.getBlock('latest')).number;
        const blockTime = (await provider.getBlock('latest')).timestamp;
        return {number: blockNumber, time: blockTime};
    };

    before(async () => {
        [owner, oracle, user_1, user_2, user_3] = await ethers.getSigners();

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

    describe('Function permissions', () => {
        const action = ethers.utils.id('STAKE').slice(0, 10); // bytes4
        before(async () => await deployRewardMaster());

        it('should only let owner to add reward advisor ', async () => {
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
            rewardMaster
                .connect(owner)
                .addRewardAdviser(
                    oracle.address,
                    action,
                    rewardAdviser.address,
                );

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

        // it('should only let owner to force-withdraw any erc20 token', async () => {});
    });

    describe.only('#onAction()', () => {
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

            it('should grant shares to the second user (user_2)', async () => {
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
                expect(offset).to.be.eq(
                    stakeAdvice.sharesToCreate
                        .mul(accumRewardPerShare)
                        .div(accumRewardPerShareScale),
                );
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

            it('should grant shares to the third user (user_3)', async () => {
                // resets mock behavior (we do not release token for second time)
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
                    vestedRewards,
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
                rewardToken.balanceOf.returns(vestedRewards);
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
                const users = [user_1, user_2];
                for (const user of users) {
                    stakedAdvice.createSharesFor = user.address;
                    rewardAdviser.adviceReward.returns(stakedAdvice);

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

                expect(await rewardMaster.totalShares()).to.be.eq(
                    totalShares.sub(shares),
                );
                expect(updatedShares).to.be.eq(BigNumber.from(0));
                expect(updatedOffset).to.be.eq(BigNumber.from(0));
            });
        });

        describe('#entitled()', async () => {
            before(async () => await deployRewardMaster());

            it('should returns reward token amount entitled to the given user_1/account', async () => {
                rewardPool.releasableAmount.returns(BigNumber.from(10).pow(18));

                await rewardMaster.entitled(owner.address);
            });
        });
    });
});
