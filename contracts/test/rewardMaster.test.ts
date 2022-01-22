import {ethers} from 'hardhat';
import {BigNumber} from 'ethers';
import {Provider} from '@ethersproject/providers';
import {expect} from 'chai';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/dist/src/signers';
import {FakeContract} from '@defi-wonderland/smock';
import {RewardMasterFixture} from './shared';
import {
    RewardPool,
    IErc20Min,
    RewardMaster,
    IRewardAdviser,
} from '../types/contracts';

describe('Reward Master', () => {
    let fixture: RewardMasterFixture;
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
    let provider: Provider;
    let startBlock: number;
    let action: string;
    const accumRewardPerShareScale = BigNumber.from(1e9); // hardcoded in RewardMaster

    before(async () => {
        fixture = new RewardMasterFixture();
        provider = ethers.provider;
    });

    const initFixture = async () => {
        fixture = new RewardMasterFixture();
        await fixture.initFixture();

        owner = fixture.signers.owner;
        oracle = fixture.signers.oracle;
        user_1 = fixture.signers.user_1;
        user_2 = fixture.signers.user_2;
        user_3 = fixture.signers.user_3;
        user_4 = fixture.signers.user_4;
        action = fixture.action;

        rewardMaster = fixture.contracts.rewardMaster;
        rewardPool = fixture.contracts.rewardPool;
        rewardToken = fixture.contracts.rewardToken;
        rewardAdviser = fixture.contracts.rewardAdviser;

        startBlock = fixture.startBlock;
    };

    describe('public variables', () => {
        before(async () => await initFixture());

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

        it('should get the block that contract deployed in', async () => {
            const startBlockLocal = await rewardMaster.START_BLOCK();
            expect(startBlockLocal).to.equal(startBlock);
        });
    });

    describe('Add/Remove adviser', () => {
        before(async () => await initFixture());

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
        });

        it('should not let non-owner add reward adviser', async () => {
            await expect(
                rewardMaster
                    .connect(user_1)
                    .addRewardAdviser(
                        oracle.address,
                        action,
                        rewardAdviser.address,
                    ),
            ).revertedWith('ImmOwn: unauthorized');
        });

        it('should only let owner to remove reward adviser', async () => {
            await expect(
                rewardMaster
                    .connect(owner)
                    .removeRewardAdviser(oracle.address, fixture.action),
            )
                .to.emit(rewardMaster, 'AdviserUpdated')
                .withArgs(oracle.address, action, ethers.constants.AddressZero);

            expect(
                await rewardMaster.rewardAdvisers(oracle.address, action),
            ).to.be.eq(ethers.constants.AddressZero);
        });

        it('should not let non-owner to remove reward adviser', async () => {
            await expect(
                rewardMaster
                    .connect(user_1)
                    .removeRewardAdviser(oracle.address, action),
            ).revertedWith('ImmOwn: unauthorized');
        });
    });

    describe('#onAction()', () => {
        const vestedRewards = BigNumber.from(10).pow(24); // 1000000e18
        const amountToStake = BigNumber.from(20).mul(
            BigNumber.from(10).pow(18),
        ); // 20e18: 20 ZKP tokens

        describe('create shares', () => {
            before(async () => {
                await initFixture();
                // release rewards to reward master contract
                rewardPool.vestRewards.returns(vestedRewards);
                rewardToken.balanceOf.returns(vestedRewards);

                await fixture.addRewardAdviser();
            });

            after(async () => {
                // reset mock
                rewardPool.vestRewards.reset();
                rewardToken.balanceOf.reset();
            });

            it('should grant shares to the first user (user_1)', async () => {
                const entitledShares =
                    fixture.convertAmountToShares(amountToStake);

                const {stakeAdvice} = fixture.getAdvice(
                    user_1.address,
                    entitledShares,
                );

                await expect(fixture.onAction(stakeAdvice))
                    .to.emit(rewardMaster, 'SharesGranted')
                    .withArgs(user_1.address, entitledShares);

                const {shares, offset} = await rewardMaster.records(
                    stakeAdvice.createSharesFor,
                );

                expect(shares).to.be.eq(entitledShares);
                expect(offset).to.be.eq(BigNumber.from(0));
                expect(await rewardMaster.totalShares()).to.be.eq(
                    entitledShares,
                );
                expect(await rewardMaster.lastVestedBlock()).to.be.eq(0);
                expect(await rewardMaster.lastBalance()).to.be.eq(0);
            });

            it('should grant shares to the second user (user_2) and vest tokens to contract', async () => {
                const entitledShares =
                    fixture.convertAmountToShares(amountToStake);

                const {stakeAdvice} = fixture.getAdvice(
                    user_2.address,
                    entitledShares,
                );

                const initialTotalShares = await rewardMaster.totalShares();

                await expect(fixture.onAction(stakeAdvice))
                    .to.emit(rewardMaster, 'SharesGranted')
                    .withArgs(user_2.address, entitledShares);

                const lastVestedBlock = (await provider.getBlock('latest'))
                    .number;

                const {shares, offset} = await rewardMaster.records(
                    stakeAdvice.createSharesFor,
                );

                const accumRewardPerShare = vestedRewards
                    .mul(accumRewardPerShareScale)
                    .div(initialTotalShares);

                expect(shares).to.be.eq(entitledShares);
                expect(offset).to.be.eq(vestedRewards);
                expect(await rewardMaster.accumRewardPerShare()).to.be.eq(
                    accumRewardPerShare,
                );
                expect(await rewardMaster.totalShares()).to.be.eq(
                    entitledShares.add(initialTotalShares),
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

                const entitledShares =
                    fixture.convertAmountToShares(amountToStake);

                const {stakeAdvice} = fixture.getAdvice(
                    user_3.address,
                    entitledShares,
                );

                const initialTotalShares = await rewardMaster.totalShares();

                await expect(fixture.onAction(stakeAdvice))
                    .to.emit(rewardMaster, 'SharesGranted')
                    .withArgs(user_3.address, entitledShares);

                const {shares, offset} = await rewardMaster.records(
                    stakeAdvice.createSharesFor,
                );

                expect(shares).to.be.eq(entitledShares);
                expect(offset).to.be.eq(vestedRewards);

                expect(await rewardMaster.totalShares()).to.be.eq(
                    entitledShares.add(initialTotalShares),
                );
                expect(await rewardMaster.lastBalance()).to.be.eq(
                    vestedRewards,
                );
            });

            it('should grant shares to the forth user (user_4) and vest tokens to the contract', async () => {
                rewardPool.vestRewards.returns(vestedRewards);
                rewardToken.balanceOf.returns(vestedRewards.mul(2));

                const entitledShares =
                    fixture.convertAmountToShares(amountToStake);

                const {stakeAdvice} = fixture.getAdvice(
                    user_4.address,
                    entitledShares,
                );

                const initialTotalShares = await rewardMaster.totalShares();

                await expect(fixture.onAction(stakeAdvice))
                    .to.emit(rewardMaster, 'SharesGranted')
                    .withArgs(user_4.address, entitledShares);

                const {shares, offset} = await rewardMaster.records(
                    stakeAdvice.createSharesFor,
                );

                const accumRewardPerShare =
                    await rewardMaster.accumRewardPerShare();

                expect(shares).to.be.eq(entitledShares);
                expect(offset).to.be.eq(
                    entitledShares
                        .mul(accumRewardPerShare)
                        .div(accumRewardPerShareScale),
                );

                expect(await rewardMaster.totalShares()).to.be.eq(
                    entitledShares.add(initialTotalShares),
                );
                expect(await rewardMaster.lastBalance()).to.be.eq(
                    vestedRewards.mul(2),
                );
            });

            it('should not grant shares if sharesToCreate is 0', async () => {
                const {stakeAdvice} = fixture.getAdvice(
                    user_1.address,
                    BigNumber.from(0),
                );

                const {shares: oldShares, offset: oldOffset} =
                    await rewardMaster.records(stakeAdvice.createSharesFor);
                const oldTotalShares = await rewardMaster.totalShares();

                await fixture.onAction(stakeAdvice);

                const {shares: newShares, offset: newOffset} =
                    await rewardMaster.records(stakeAdvice.createSharesFor);
                const newTotalShares = await rewardMaster.totalShares();

                expect(oldShares).to.be.eq(newShares);
                expect(oldOffset).to.be.eq(newOffset);
                expect(oldTotalShares).to.be.eq(newTotalShares);
            });
        });

        describe('redeem shares', () => {
            before(async () => {
                await initFixture();

                // release rewards to reward master contract
                rewardPool.vestRewards.returns(vestedRewards);
                rewardToken.transfer.returns(true);

                await fixture.addRewardAdviser();

                // create shares for users
                await fixture.createSharesForSigners(
                    fixture.convertAmountToShares(amountToStake),
                    vestedRewards,
                );

                rewardPool.vestRewards.reset();
            });

            after(async () => {
                // reset mock
                rewardPool.vestRewards.reset();
                rewardToken.balanceOf.reset();
            });

            it('should redeem shares of the user who has been granted shares', async () => {
                const entitledShares =
                    fixture.convertAmountToShares(amountToStake);

                const {unstakeAdvice} = fixture.getAdvice(
                    user_1.address,
                    entitledShares,
                );

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

                await expect(fixture.onAction(unstakeAdvice))
                    .to.emit(rewardMaster, 'SharesRedeemed')
                    .withArgs(user_1.address, entitledShares);

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
                const randomUser = ethers.Wallet.createRandom().address;

                const {unstakeAdvice} = fixture.getAdvice(
                    randomUser,
                    BigNumber.from(1),
                );
                await expect(
                    fixture.onAction(unstakeAdvice),
                ).to.be.revertedWith('RM: Not enough shares to redeem');
            });

            it('should redeem part of shares of the user_2 who has been granted shares', async () => {
                const partOfEntitledShares = fixture.convertAmountToShares(
                    amountToStake.mul(9).div(10),
                );

                const {unstakeAdvice} = fixture.getAdvice(
                    user_2.address,
                    partOfEntitledShares, // 90% of the shares
                );

                const {shares, offset} = await rewardMaster.records(
                    user_2.address,
                );
                expect(shares).to.be.eq(
                    fixture.convertAmountToShares(amountToStake),
                );

                const accumRewardPerShare =
                    await rewardMaster.accumRewardPerShare();

                const totalShares = await rewardMaster.totalShares();
                const lastBalance = await rewardMaster.lastBalance();

                const reward = unstakeAdvice.sharesToRedeem
                    .mul(accumRewardPerShare)
                    .div(accumRewardPerShareScale)
                    .sub(offset.mul(9).div(10));

                await expect(fixture.onAction(unstakeAdvice))
                    .to.emit(rewardMaster, 'SharesRedeemed')
                    .withArgs(user_2.address, partOfEntitledShares);

                const {shares: updatedShares, offset: updatedOffset} =
                    await rewardMaster.records(user_2.address);

                const updatedLastBalance = await rewardMaster.lastBalance();

                expect(await rewardMaster.totalShares()).to.be.eq(
                    totalShares.sub(partOfEntitledShares),
                );
                expect(updatedLastBalance).to.be.eq(lastBalance.sub(reward));
                expect(updatedShares).to.be.eq(
                    shares.sub(partOfEntitledShares),
                );
                expect(updatedOffset).to.be.eq(offset.mul(1).div(10)); // 10%

                // nobody is sent tokens to contract directly
                rewardToken.balanceOf.returns(updatedLastBalance);
            });

            it('should redeem the rest of shares of the user_2', async () => {
                const {shares, offset} = await rewardMaster.records(
                    user_2.address,
                );

                const {unstakeAdvice} = fixture.getAdvice(
                    user_2.address,
                    shares,
                );

                const accumRewardPerShare =
                    await rewardMaster.accumRewardPerShare();

                const totalShares = await rewardMaster.totalShares();
                const lastBalance = await rewardMaster.lastBalance();

                const reward = unstakeAdvice.sharesToRedeem
                    .mul(accumRewardPerShare)
                    .div(accumRewardPerShareScale)
                    .sub(offset);

                await expect(fixture.onAction(unstakeAdvice))
                    .to.emit(rewardMaster, 'SharesRedeemed')
                    .withArgs(user_2.address, shares);

                const {shares: updatedShares, offset: updatedOffset} =
                    await rewardMaster.records(user_2.address);

                const updatedLastBalance = await rewardMaster.lastBalance();

                expect(await rewardMaster.totalShares()).to.be.eq(
                    totalShares.sub(shares),
                );
                expect(updatedLastBalance).to.be.eq(lastBalance.sub(reward));
                expect(updatedShares).to.be.eq(shares.sub(shares));
                expect(updatedOffset).to.be.eq(0);

                // nobody is sent tokens to contract directly
                rewardToken.balanceOf.returns(updatedLastBalance);
            });
        });
    });

    describe('#entitled()', async () => {
        const releasableAmount = BigNumber.from(10).pow(24); // 1000000e18
        const vestedRewards = releasableAmount;
        const amountToStake = BigNumber.from(20).mul(
            BigNumber.from(10).pow(18),
        ); // 20e18: 20 ZKP tokens

        before(async () => {
            await initFixture();
            rewardPool.releasableAmount.returns(releasableAmount);

            // add reward adviser
            await fixture.addRewardAdviser();

            // create shares for users
            await fixture.createSharesForSigners(
                fixture.convertAmountToShares(amountToStake),
                vestedRewards,
            );

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
            const randomUser = ethers.Wallet.createRandom().address;

            const entitled = await rewardMaster.entitled(randomUser);

            expect(entitled).to.be.eq(0);
        });
    });

    describe('#claimErc20()', async () => {
        before(async () => await initFixture());

        it('should not let admin withdraw reward tokens from contract when there are some shares', async () => {
            await fixture.addRewardAdviser();

            await fixture.createSharesForSigners(
                fixture.convertAmountToShares(BigNumber.from(999)),
                BigNumber.from(999999),
            );

            await expect(
                rewardMaster
                    .connect(owner)
                    .claimErc20(rewardToken.address, owner.address, 1),
            ).to.be.revertedWith('RM: Failed to claim');
        });
    });
});
