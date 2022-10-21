import {smock, MockContract, FakeContract} from '@defi-wonderland/smock';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import chai from 'chai';
import {BigNumber, BaseContract} from 'ethers';
import hre from 'hardhat';

const expect = chai.expect;

const {getSigners} = hre.ethers;

chai.should(); // if you like should syntax
chai.use(smock.matchers);

function toBN(n: number) {
    return BigNumber.from(n);
}

describe('RewardPool', async () => {
    let rewardPool: MockContract<BaseContract>;
    let vestingPoolFactory: FakeContract<BaseContract>;
    let deployer: SignerWithAddress;
    let alice: SignerWithAddress;
    let wallet1: SignerWithAddress;
    let wallet2: SignerWithAddress;

    before(async function () {
        [deployer, alice, wallet1, wallet2] = await getSigners();
    });

    beforeEach(async () => {
        const rewardPoolFactory = await smock.mock('RewardPool');
        vestingPoolFactory = await smock.fake('IVestingPools');
        rewardPool = await rewardPoolFactory.deploy(
            vestingPoolFactory.address,
            deployer.address,
        );
    });

    describe('contract initialisation', async () => {
        it('returns error in initialisation when expired timestamp is passed', async () => {
            // const f = await rewardPool.transferPoolWalletRole(wallet1.address)
            // vestingPoolFactory.getWallet.returns(rewardPool.address)
            const expiryTime = Math.round(+new Date() / 1000) - 100;
            await expect(
                rewardPool.initialize(0, alice.address, expiryTime),
            ).to.be.revertedWith(
                "VM Exception while processing transaction: reverted with reason string 'RP: expired'",
            );
        });

        it('returns error in initialisation when 0th address is not used', async () => {
            const expiryTime = Math.round(+new Date() / 1000) - 100;
            await expect(
                rewardPool.initialize(
                    0,
                    '0x0000000000000000000000000000000000000000',
                    expiryTime,
                ),
            ).to.be.revertedWith(
                "VM Exception while processing transaction: reverted with reason string 'RP: zero address'",
            );
        });

        it('returns error in initialisation when wallet address of pool is not used', async () => {
            const expiryTime = Math.round(+new Date() / 1000) + 100;
            await expect(
                rewardPool.initialize(0, alice.address, expiryTime),
            ).to.be.revertedWith(
                "VM Exception while processing transaction: reverted with reason string 'RP:E7'",
            );
        });

        it('successfully initializes the contract', async () => {
            vestingPoolFactory.getWallet.returns(rewardPool.address);
            const expiryTime = Math.round(+new Date() / 1000) + 100;
            await expect(rewardPool.initialize(0, alice.address, expiryTime))
                .to.emit(rewardPool, 'Initialized')
                .withArgs(0, alice.address, expiryTime);
        });
    });

    describe('releasable amount', async () => {
        beforeEach(async () => {
            const rewardPoolFactory = await smock.mock('RewardPool');
            vestingPoolFactory = await smock.fake('IVestingPools');
            rewardPool = await rewardPoolFactory.deploy(
                vestingPoolFactory.address,
                deployer.address,
            );
        });

        it('return 0 releasable amount of tokens when tokens are not vested', async () => {
            vestingPoolFactory.getWallet.returns(rewardPool.address);
            const expiryTime = Math.round(+new Date() / 1000) + 100;
            await rewardPool.initialize(0, alice.address, expiryTime);
            const releasableAmount = await rewardPool.releasableAmount();
            expect(releasableAmount).to.eql(toBN(0));
        });

        it('return 100 releasable amount of tokens when 100 tokens are vested', async () => {
            vestingPoolFactory.getWallet.returns(rewardPool.address);
            vestingPoolFactory.releasableAmount.returns(100);
            const expiryTime = Math.round(+new Date() / 1000) + 100;
            await rewardPool.initialize(0, alice.address, expiryTime);
            const releasableAmount = await rewardPool.releasableAmount();
            expect(releasableAmount).to.eql(toBN(100));
        });
    });

    describe('RewardPool vest rewards', async () => {
        beforeEach(async () => {
            const rewardPoolFactory = await smock.mock('RewardPool');
            vestingPoolFactory = await smock.fake('IVestingPools');
            rewardPool = await rewardPoolFactory.deploy(
                vestingPoolFactory.address,
                deployer.address,
            );
        });
        it('revert if unauthorized vestRewards() call is made', async () => {
            vestingPoolFactory.getWallet.returns(rewardPool.address);
            vestingPoolFactory.releasableAmount.returns(100);
            const expiryTime = Math.round(+new Date() / 1000) + 100;
            await rewardPool.initialize(0, alice.address, expiryTime);
            await expect(rewardPool.vestRewards()).to.be.revertedWith(
                "VM Exception while processing transaction: reverted with reason string 'RP: unauthorized'",
            );
        });

        it('doesnt release any reward tokens to recipient when releasable amount is 0', async () => {
            vestingPoolFactory.getWallet.returns(rewardPool.address);
            vestingPoolFactory.releasableAmount.returns(0);
            const expiryTime = Math.round(+new Date() / 1000) + 100;
            await rewardPool.initialize(0, alice.address, expiryTime);
            await expect(rewardPool.connect(alice).vestRewards()).not.to.emit(
                rewardPool,
                'Vested',
            );
        });

        it('successfully vest and release 100 reward tokens to recipient', async () => {
            vestingPoolFactory.getWallet.returns(rewardPool.address);
            vestingPoolFactory.releasableAmount.returns(100);
            const expiryTime = Math.round(+new Date() / 1000) + 100;
            await rewardPool.initialize(0, alice.address, expiryTime);
            await expect(rewardPool.connect(alice).vestRewards()).to.emit(
                rewardPool,
                'Vested',
            );
        });
    });

    describe('transferPoolWalletRole', async () => {
        beforeEach(async () => {
            const rewardPoolFactory = await smock.mock('RewardPool');
            vestingPoolFactory = await smock.fake('IVestingPools');
            rewardPool = await rewardPoolFactory.deploy(
                vestingPoolFactory.address,
                deployer.address,
            );
        });

        it('reverts when 0 address passed while transferring wallet role', async () => {
            vestingPoolFactory.getWallet.returns(rewardPool.address);
            vestingPoolFactory.releasableAmount.returns(100);
            const expiryTime = Math.round(+new Date() / 1000) + 100;
            await rewardPool.initialize(0, alice.address, expiryTime);
            await expect(
                rewardPool.transferPoolWalletRole(
                    '0x0000000000000000000000000000000000000000',
                ),
            ).to.be.revertedWith(
                "VM Exception while processing transaction: reverted with reason string 'RP: zero address",
            );
        });

        it('reverts when non-owner calls transferPoolWalletRole()', async () => {
            vestingPoolFactory.getWallet.returns(rewardPool.address);
            vestingPoolFactory.releasableAmount.returns(100);
            const expiryTime = Math.round(+new Date() / 1000) + 100;
            await rewardPool.initialize(0, alice.address, expiryTime);
            await expect(
                rewardPool
                    .connect(wallet1)
                    .transferPoolWalletRole(wallet2.address),
            ).to.be.revertedWith(
                "VM Exception while processing transaction: reverted with reason string 'ImmOwn: unauthorized",
            );
        });

        it('successfully transfers pool wallet address', async () => {
            vestingPoolFactory.getWallet.returns(rewardPool.address);
            vestingPoolFactory.releasableAmount.returns(100);
            const expiryTime = Math.round(+new Date() / 1000) + 100;
            await rewardPool.initialize(0, alice.address, expiryTime);
            await rewardPool
                .connect(deployer)
                .transferPoolWalletRole(wallet2.address);
        });
    });
});
