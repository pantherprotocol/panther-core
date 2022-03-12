import {ethers} from 'hardhat';
import {BigNumber} from 'ethers';
import {expect} from 'chai';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/dist/src/signers';
import {FakeContract, smock} from '@defi-wonderland/smock';
import {IErc20Min, MaticRewardPool} from '../types/contracts';
import {mineBlock, revertSnapshot, takeSnapshot} from '../lib/hardhat';

describe('Matic Reward Pool', () => {
    let rewardToken: FakeContract<IErc20Min>;
    let maticRewardPool: MaticRewardPool;
    let owner: SignerWithAddress;
    let recipient: SignerWithAddress;
    let startTime: number;
    let endTime: number;
    let snapshotId: number;

    before(async () => {
        snapshotId = await takeSnapshot();

        [owner, recipient] = await ethers.getSigners();

        rewardToken = await smock.fake('IErc20Min');
    });

    after(async function () {
        await revertSnapshot(snapshotId);
    });

    beforeEach(async () => {
        startTime = (await getCurrentTime()) + 100;
        endTime = startTime + 86400;

        const MaticRewardPool = await ethers.getContractFactory(
            'MaticRewardPool',
        );
        maticRewardPool = (await MaticRewardPool.deploy(
            rewardToken.address,
            owner.address,
        )) as MaticRewardPool;
    });

    context('When contract has not been initialized', () => {
        describe('#initialize', () => {
            it('should initialize the contract', async () => {
                await expect(
                    maticRewardPool.initialize(
                        recipient.address,
                        startTime,
                        endTime,
                    ),
                )
                    .to.emit(maticRewardPool, 'Initialized')
                    .withArgs(0, recipient.address, endTime);

                expect(await maticRewardPool.recipient()).to.equal(
                    recipient.address,
                );
                expect(await maticRewardPool.startTime()).to.equal(startTime);
                expect(await maticRewardPool.endTime()).to.equal(endTime);
            });

            it('should not initialize the contract twice', async () => {
                await expect(
                    maticRewardPool.initialize(
                        recipient.address,
                        startTime,
                        endTime,
                    ),
                )
                    .to.emit(maticRewardPool, 'Initialized')
                    .withArgs(0, recipient.address, endTime);

                await expect(
                    maticRewardPool.initialize(
                        recipient.address,
                        startTime,
                        endTime,
                    ),
                ).to.be.revertedWith('RP: initialized');
            });

            it('should not initialize contract by non-owner', async () => {
                await expect(
                    maticRewardPool
                        .connect(recipient)
                        .initialize(recipient.address, startTime, endTime),
                ).to.be.revertedWith('ImmOwn: unauthorized');
            });

            it('should not initialize contract when end time is less than current time', async () => {
                await expect(
                    maticRewardPool.initialize(recipient.address, startTime, 0),
                ).to.be.revertedWith('RP: I2');
            });

            it('should not initialize contract when end time is less than start time', async () => {
                await expect(
                    maticRewardPool.initialize(
                        recipient.address,
                        startTime,
                        startTime,
                    ),
                ).to.be.revertedWith('RP: I3');
            });
        });

        describe('#releasableAmount()', () => {
            it('should return the 0 releasable amount if contract has not been initialized', async () => {
                expect(await maticRewardPool.releasableAmount()).to.equal(0);
            });
        });
    });

    context('When contract has been initialized', () => {
        beforeEach(async () => {
            await maticRewardPool.initialize(
                recipient.address,
                startTime,
                endTime,
            );
        });
        describe('#initialize', () => {
            it('should not initialize the contract twice', async () => {
                await expect(
                    maticRewardPool.initialize(
                        recipient.address,
                        startTime,
                        endTime,
                    ),
                ).to.be.revertedWith('RP: initialized');
            });
        });

        describe('#vestRewards', () => {
            it('should vest token to recipient', async () => {
                const balance = BigNumber.from(10).pow(24);
                fakeBalance(balance);

                // fast-forward 1/2 through the reward window
                await mineBlock(startTime + 43200);

                await expect(
                    maticRewardPool.connect(recipient).vestRewards(),
                ).to.emit(maticRewardPool, 'Vested');

                const now = await getCurrentTime();

                expect(rewardToken.transfer).to.have.been.calledWith(
                    recipient.address,
                    getReleasableAmount(balance, now),
                );
            });

            it('should throw if sender is not recipient', async () => {
                await expect(
                    maticRewardPool.connect(owner).vestRewards(),
                ).to.be.revertedWith('RP: unauthorized');
            });
        });

        describe('#releasableAmount()', () => {
            const balance = BigNumber.from(10).pow(24);

            it('should return the 0 releasable amount if vesting is not started', async () => {
                fakeBalance(balance);

                expect(await maticRewardPool.releasableAmount()).to.be.eq(0);
            });

            it('should return 1/4 of the balance when 1/4 of the vesting period elapsed', async () => {
                fakeBalance(balance);
                await mineBlock(startTime + 21600);

                expect(await maticRewardPool.releasableAmount()).to.be.eq(
                    balance.div(4),
                );
            });

            it('should return 3/4 of the balance when 3/4 of the vesting period elapsed', async () => {
                fakeBalance(balance);
                await mineBlock(startTime + 64800);

                expect(await maticRewardPool.releasableAmount()).to.be.eq(
                    balance.mul(3).div(4),
                );
            });

            it('should return the balance as releasable amount when vesting is ended', async () => {
                fakeBalance(balance);
                await mineBlock(endTime + 1);

                expect(await maticRewardPool.releasableAmount()).to.be.eq(
                    balance,
                );
            });
        });

        describe('#claimErc20()', () => {
            it('should not claim reward token before end time', async () => {
                await expect(
                    maticRewardPool.claimErc20(
                        rewardToken.address,
                        owner.address,
                        99,
                    ),
                ).to.be.revertedWith('RP: prohibited');
            });

            it('should claim reward token after end time', async () => {
                mineBlock(endTime + 1);

                rewardToken.transfer.returns(true);

                await maticRewardPool.claimErc20(
                    rewardToken.address,
                    owner.address,
                    99,
                );

                expect(rewardToken.transfer).to.have.been.calledWith(
                    owner.address,
                    99,
                );
            });
        });
    });

    function fakeBalance(balance: BigNumber) {
        rewardToken.balanceOf.returns(balance);
    }

    function getReleasableAmount(balance: BigNumber, now: number) {
        if (startTime > now) {
            return 0;
        }

        if (now >= endTime) {
            return balance;
        }

        const timeElapsed = now - startTime;
        return balance.mul(timeElapsed).div(endTime - startTime);
    }

    async function getCurrentTime() {
        return (await ethers.provider.getBlock('latest')).timestamp;
    }
});
