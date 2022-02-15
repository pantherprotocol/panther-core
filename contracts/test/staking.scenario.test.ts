import {BigNumber, Contract} from 'ethers';
import chai from 'chai';
import {ethers} from 'hardhat';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/dist/src/signers';

import {RewardMaster, RewardPool, Staking} from '../types/contracts';

import abiZkpToken from './assets/ZKPToken.json';
import abiVestingPools from './assets/VestingPools.json';
import {getScenario, Scenario} from './assets/staking.scenario.data';
import {
    mineBlock,
    revertSnapshot,
    takeSnapshot,
} from './helpers/hardhatHelpers';

const expect = chai.expect;
const toBN = ethers.BigNumber.from;

// bytes4(keccak256("classic"))
const CLASSIC = '0x4ab0941a';
// bytes4(keccak256(abi.encodePacked(bytes4(keccak256("stake")), bytes4(keccak256("classic")))))
const STAKE = '0x1e4d02b5';
// bytes4(keccak256(abi.encodePacked(bytes4(keccak256("unstake")), bytes4(keccak256("classic")))))
const UNSTAKE = '0x493bdf45';

describe('Staking, RewardMaster, StakeRewardAdviser and other contracts', async () => {
    let provider: any;
    let startTime: number;
    let scenario: Scenario;
    let zkpToken: Contract;
    let vestingPools: Contract;
    let rewardPool: RewardPool;
    let rewardMaster: RewardMaster;
    let staking: Staking;
    let deployer: SignerWithAddress;
    let snapshotId: number;
    const users = Array(4) as SignerWithAddress[];
    const poolId = 0;

    before(async () => {
        snapshotId = await takeSnapshot();
        provider = ethers.provider;
        startTime = await getTime();
        scenario = getScenario(startTime);

        [deployer, users[0], users[1], users[2], users[3]] =
            await ethers.getSigners();

        const ZKPTokenContract = new ethers.ContractFactory(
            abiZkpToken.abi,
            abiZkpToken.bytecode,
            deployer,
        );
        zkpToken = await ZKPTokenContract.deploy(deployer.address);

        // Let's give users tokens to stake
        await zkpToken.mint(users[0].address, scenario.totals.tokenStaked[0]);
        await zkpToken.mint(users[1].address, scenario.totals.tokenStaked[1]);
        await zkpToken.mint(users[2].address, scenario.totals.tokenStaked[2]);
        await zkpToken.mint(users[3].address, scenario.totals.tokenStaked[3]);

        // "Hack" to link the bytecode. The compiler uses the hash of the
        // library name surrounded by __$...$__ as a placeholder in the bytecode
        // for linking the library later.  In this case it is the TokenAddress
        // library in contracts/utils/Linking.sol which is acting as the
        // placeholder for the ZKPToken contract.
        const linkedBytecode = abiVestingPools.bytecode.replace(
            /__\$dec3ebc58bfa2d6d17c9f2277dbc63d4a3\$__/g,
            zkpToken.address.replace('0x', ''),
        );
        const VestingPoolsContract = new ethers.ContractFactory(
            abiVestingPools.abi,
            linkedBytecode,
            deployer,
        );
        vestingPools = await VestingPoolsContract.deploy();

        await zkpToken.setMinter(vestingPools.address);

        const RewardPoolContract = await ethers.getContractFactory(
            'RewardPool',
            deployer,
        );
        rewardPool = (await RewardPoolContract.deploy(
            vestingPools.address,
            deployer.address,
        )) as RewardPool;

        await vestingPools.addVestingPools(
            [rewardPool.address],
            [scenario.vestingPool],
        );
        expect(
            await vestingPools.getWallet(poolId),
            'poolId unexpected',
        ).to.be.eq(rewardPool.address);

        const StakeRewardAdviserContract = await ethers.getContractFactory(
            'StakeRewardAdviser',
            deployer,
        );
        const stakeRewardAdviser = await StakeRewardAdviserContract.deploy(
            CLASSIC,
            1000,
        );

        const RewardMasterContract = await ethers.getContractFactory(
            'RewardMaster',
            deployer,
        );
        rewardMaster = (await RewardMasterContract.deploy(
            zkpToken.address,
            rewardPool.address,
            deployer.address,
        )) as RewardMaster;

        await rewardPool.initialize(
            poolId,
            rewardMaster.address,
            2 ** 32 - 1, // max timestamp
        );

        const StakingContract = await ethers.getContractFactory(
            'Staking',
            deployer,
        );
        staking = (await StakingContract.deploy(
            zkpToken.address,
            rewardMaster.address,
            deployer.address,
        )) as Staking;

        await rewardMaster.addRewardAdviser(
            staking.address,
            STAKE,
            stakeRewardAdviser.address,
        );
        await rewardMaster.addRewardAdviser(
            staking.address,
            UNSTAKE,
            stakeRewardAdviser.address,
        );

        await staking.addTerms(CLASSIC, {
            isEnabled: true,
            isRewarded: true,
            minAmountScaled: 0,
            maxAmountScaled: 0,
            allowedSince: 0,
            allowedTill: 0,
            lockedTill: 0,
            exactLockPeriod: 0,
            minLockPeriod: 100,
        });

        await zkpToken
            .connect(users[0])
            .increaseAllowance(staking.address, scenario.totals.tokenStaked[0]);
        await zkpToken
            .connect(users[1])
            .increaseAllowance(staking.address, scenario.totals.tokenStaked[1]);
        await zkpToken
            .connect(users[2])
            .increaseAllowance(staking.address, scenario.totals.tokenStaked[2]);
        await zkpToken
            .connect(users[3])
            .increaseAllowance(staking.address, scenario.totals.tokenStaked[3]);
    });

    after(async function () {
        await revertSnapshot(snapshotId);
    });

    playPointAndCheckResult(0, 0);
    playPointAndCheckResult(1, 300);
    playPointAndCheckResult(2, 300);
    playPointAndCheckResult(3, 300);
    playPointAndCheckResult(4, 300);
    playPointAndCheckResult(5, 300);
    playPointAndCheckResult(6, 300);
    playPointAndCheckResult(7, 300);
    playPointAndCheckResult(8, 300);

    checkFinalUserTokenBalance(0);
    checkFinalUserTokenBalance(1);
    checkFinalUserTokenBalance(2);
    checkFinalUserTokenBalance(3);

    async function getTime(): Promise<number> {
        return (await provider.getBlock('latest')).timestamp;
    }

    function playPointAndCheckResult(pInd: number, blocksToPreMine = 0) {
        it(`shall play scenario step #${pInd}`, async () => {
            const {timestamp, stakesStaked, stakesUnstaked} =
                scenario.points[pInd];

            // First, pre-mine required number of blocks
            const blocksToMine = blocksToPreMine > 1 ? blocksToPreMine : 1;
            for (let i = 0; i < blocksToMine - 1; i++) {
                const blockTime = timestamp - 5 * (blocksToMine - i);
                await mineBlock(blockTime);
            }
            await mineBlock(timestamp - 5);

            // All txs must get in the same block with the expected timestamp
            // therefore we temporarily disable "auto-mine"
            await provider.send('evm_setAutomine', [false]);

            if (!stakesStaked && !stakesUnstaked) {
                // No stake/unstake txs which trigger vesting "under the hood"
                // Let's trigger it explicitly
                await rewardMaster.triggerVesting();
            }

            if (stakesStaked) {
                for (const i of stakesStaked) {
                    const {user: userId, amount} = scenario.stakes[i];
                    await staking
                        .connect(users[userId])
                        .stake(amount, CLASSIC, '0x00', {gasLimit: 500000});
                }
            }
            if (stakesUnstaked) {
                for (const i of stakesUnstaked) {
                    const {user: userId, stakeID} = scenario.stakes[i];
                    await staking
                        .connect(users[userId])
                        .unstake(stakeID, '0x00', false);
                }
            }

            // Manual mining required when auto-mine is disabled
            await mineBlock(timestamp);
            await provider.send('evm_setAutomine', [true]);
        });

        it(`shall retain expected amount of staked tokens`, async () => {
            const {timestamp, stakedBalances} = scenario.points[pInd];
            expect(await getTime(), 'timestamp').to.be.eq(timestamp);
            expect(await zkpToken.balanceOf(staking.address)).to.be.eq(
                arrayTotal(stakedBalances),
            );
        });

        it(`shall have expected amount of outstanding shares`, async () => {
            const {timestamp, sharesBalances} = scenario.points[pInd];
            expect(await getTime(), 'timestamp').to.be.eq(timestamp);
            expect(await rewardMaster.totalShares()).to.be.eq(
                arrayTotal(sharesBalances),
            );
        });

        it(`shall retain expected amount of reward tokens`, async () => {
            const {timestamp, rewardTokenBalances} = scenario.points[pInd];
            expect(await getTime(), 'timestamp').to.be.eq(timestamp);
            expect(await zkpToken.balanceOf(rewardMaster.address)).to.be.eq(
                arrayTotal(rewardTokenBalances),
            );
        });

        xit(`shall report expected entitled token amount for every user`, async () => {
            // TODO: implement assertion of "entitled" amounts
        });
    }

    function checkFinalUserTokenBalance(userId: number) {
        it(`shall return both staked and rewarded tokens to user #${userId}`, async () => {
            const {timestamp} = scenario.points[scenario.points.length - 1];
            expect(await getTime(), 'timestamp').to.be.eq(timestamp);

            expect(await zkpToken.balanceOf(users[userId].address)).to.be.eq(
                scenario.totals.tokenUnstaked[userId].add(
                    scenario.totals.rewardTokenPaid[userId],
                ),
            );
        });
    }

    function arrayTotal(bigNumbers: BigNumber[]): BigNumber {
        return bigNumbers.reduce((acc: BigNumber, v) => acc.add(v), toBN(0));
    }
});
