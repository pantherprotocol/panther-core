import {ethers} from 'hardhat';
import {expect} from 'chai';
import {BigNumber} from 'ethers';
import {ZkpFaucet, TokenMock} from '../../types/contracts';
import {toBN} from '../../lib/units-shortcuts';
import {revertSnapshot, takeSnapshot} from '../../lib/hardhat';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

describe('Zkp Faucet', () => {
    let faucet: ZkpFaucet;
    let token: TokenMock;
    let user: SignerWithAddress;
    let owner: SignerWithAddress;
    let snapshot: number;
    let cupSize: BigNumber;
    let tokenPrice: BigNumber;
    let maxAmountToPay: BigNumber;
    let maxRequestCount: BigNumber;

    before(async () => {
        [owner, user] = await ethers.getSigners();
        tokenPrice = toBN(0);
        cupSize = toBN('1000');
        maxAmountToPay = toBN('100');
        maxRequestCount = toBN('2');

        const Token = await ethers.getContractFactory('TokenMock');
        token = (await Token.connect(user).deploy()) as TokenMock;

        const Faucet = await ethers.getContractFactory('ZkpFaucet');
        faucet = (await Faucet.deploy(
            owner.address,
            token.address,
            tokenPrice,
            maxAmountToPay,
            cupSize,
            maxRequestCount,
        )) as ZkpFaucet;

        // send some tokens to the Faucet contract
        const claimableBalance = toBN('1000000');
        await token.connect(user).transfer(faucet.address, claimableBalance);
    });

    beforeEach(async () => {
        snapshot = await takeSnapshot();
    });

    afterEach(async () => {
        await revertSnapshot(snapshot);
    });

    describe('ownable functions', () => {
        describe('#updateRestrictToWhitelisted', () => {
            it('should toggle the restrictToWhitelisted by owner', async () => {
                await faucet.connect(owner).updateRestrictToWhitelisted(true);
                expect(await faucet.restrictToWhitelisted()).to.be.true;
            });

            it('should revert when executed by non owner', async () => {
                // non owner
                await expect(
                    faucet.connect(user).updateRestrictToWhitelisted(false),
                ).to.be.revertedWith('ImmOwn: unauthorized');
            });
        });

        describe('#updateMaxDrinkCount', () => {
            it('should change the Drink counts', async () => {
                await faucet.connect(owner).updateMaxDrinkCount(10);
                expect(await faucet.maxDrinkCount()).to.eq(10);
            });

            it('should revert when executed by non owner', async () => {
                // non owner
                await expect(
                    faucet.connect(user).updateMaxDrinkCount(10),
                ).to.be.revertedWith('ImmOwn: unauthorized');
            });
        });

        describe('#whitelistBatch', () => {
            it('should add whitelisted address by owner', async () => {
                await faucet
                    .connect(owner)
                    .whitelistBatch([user.address], [true]);
                expect(await faucet.isWhitelisted(user.address)).to.be.true;
            });

            it('should revert when executed by non owner', async () => {
                // non owner
                await expect(
                    faucet.connect(user).whitelistBatch([user.address], [true]),
                ).to.be.revertedWith('ImmOwn: unauthorized');
            });
        });

        describe('#updateCupSize', () => {
            it('should update the donate amount by owner', async () => {
                await faucet.connect(owner).updateCupSize(10);
                expect(await faucet.cupSize()).to.eq(10);
            });

            it('should revert when executed by non owner', async () => {
                // non owner
                await expect(
                    faucet.connect(user).updateCupSize(10),
                ).to.be.revertedWith('ImmOwn: unauthorized');
            });
        });

        describe('#updateTokenPrice', () => {
            it('should update the token price by owner', async () => {
                await faucet.connect(owner).updateTokenPrice(10);
                expect(await faucet.tokenPrice()).to.eq(10);
            });

            it('should revert when executed by non owner', async () => {
                // non owner
                await expect(
                    faucet.connect(user).updateTokenPrice(10),
                ).to.be.revertedWith('ImmOwn: unauthorized');
            });
        });

        describe('#claimErc20', () => {
            it('should claim the ERC20 token', async () => {
                const userBalance = await token.balanceOf(user.address);

                await faucet
                    .connect(owner)
                    .withdraw(token.address, user.address, 100);

                expect(await token.balanceOf(user.address)).to.eq(
                    userBalance.add(100),
                );
            });

            it('should claim the native token', async () => {
                const userBalance = await ethers.provider.getBalance(
                    user.address,
                );

                await faucet
                    .connect(owner)
                    .drink(owner.address, {value: maxAmountToPay});

                await faucet
                    .connect(owner)
                    .withdraw(
                        ethers.constants.AddressZero,
                        user.address,
                        maxAmountToPay,
                    );

                expect(await ethers.provider.getBalance(user.address)).to.eq(
                    userBalance.add(maxAmountToPay),
                );
            });

            it('revert when executed by non owner', async () => {
                // non owner
                await expect(
                    faucet
                        .connect(user)
                        .withdraw(token.address, user.address, 100),
                ).to.be.revertedWith('ImmOwn: unauthorized');
            });
        });
    });

    describe('#drink', async () => {
        describe('when token price is not defined', () => {
            it('should donate tokens to user based on cupSize value', async () => {
                const userBalance = await token.balanceOf(user.address);

                await faucet.connect(user).drink(user.address);

                expect(await token.balanceOf(user.address)).to.eq(
                    userBalance.add(cupSize),
                );
            });
        });

        describe('when token price is defined', () => {
            const price = toBN('10');

            beforeEach(async () => {
                await faucet.connect(owner).updateTokenPrice(price);
                expect(await faucet.tokenPrice()).to.eq(price);
            });

            it('should donate tokens to user based on the paid amount', async () => {
                const tokenAmount = 10;
                const amountToPay = price.mul(tokenAmount);

                const userBalance = await token.balanceOf(user.address);
                await faucet
                    .connect(user)
                    .drink(user.address, {value: amountToPay});

                expect(await token.balanceOf(user.address)).to.eq(
                    userBalance.add(tokenAmount),
                );
            });

            it('should not donate tokens to user when paid amount is too high', async () => {
                await expect(
                    faucet.drink(user.address, {value: maxAmountToPay.add(1)}),
                ).to.revertedWith('High value');
            });
        });

        describe('when max request count is enabled', () => {
            beforeEach(async () => {
                await faucet.updateMaxDrinkCount(2);
                expect(await faucet.maxDrinkCount()).to.be.eq(2);
            });

            it('should not donate user if user requests are too much', async () => {
                // first time
                await faucet.connect(user).drink(user.address);
                expect(await faucet.drinkCount(user.address)).to.eq(1);

                // second time
                await faucet.connect(user).drink(user.address);
                expect(await faucet.drinkCount(user.address)).to.eq(2);

                // third time
                await expect(
                    faucet.connect(user).drink(user.address),
                ).to.revertedWith('Reached maximum drink count');
            });
        });

        describe('when only whitelisted users can request for token', () => {
            beforeEach(async () => {
                await faucet.updateRestrictToWhitelisted(true);
                expect(await faucet.restrictToWhitelisted()).to.be.true;

                await faucet
                    .connect(owner)
                    .whitelistBatch([user.address], [true]);
                expect(await faucet.isWhitelisted(user.address)).to.be.true;
            });

            it('should let whitelisted user to request token', async () => {
                const userBalance = await token.balanceOf(user.address);
                await faucet.connect(user).drink(user.address);

                expect(await token.balanceOf(user.address)).to.eq(
                    userBalance.add(cupSize),
                );
            });

            it('should not let non-whitelisted user call donate when Faucet is restricted to whitelisted', async () => {
                await expect(
                    faucet.connect(owner).drink(user.address),
                ).to.revertedWith('Not whitelisted');
            });
        });
    });
});
