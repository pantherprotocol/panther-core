/*
These helpers are specifically  written for testing the walk-around for the bug
with `unstake` on the Ethereum mainnet after May 4th, 2022.
(refer to comments in StakeRewardController2.sol for more info).

!!! Run it with `export HARDHAT_FORKING_BLOCK=14718275`

Usage exmple:
```
const {
    defineContracts,
    deployStakeRewardController2,
    initializeStakeRewardController2,
    testUnstake
} = require("./testing/unstake-mainnet-fix/unstakeBugTestHelpers")

await defineContracts();
await deployStakeRewardController2();
await initializeStakeRewardController2();

await testUnstake('0x05bd4c867bc95ec76c242f007b3716ab539d6db1', 0);
await testUnstake('0x6407faa0dbcf9eb9a8897d27890133915549782d', 0);
```
*/

module.exports = {
    defineContracts,
    deployStakeRewardController2,
    initializeStakeRewardController2,
    testUnstake,
};

const {
    impersonate,
    unimpersonate,
    ensureMinBalance,
} = require('../../lib/hardhat');
const toLog = console.log;
const toBN = ethers.BigNumber.from;

const unstakeAction = '0x493bdf45';
const stuckUnclaimed = toBN('3555666824442000000000000');

const daoAddr = '0x505796f5bc290269d2522cf19135ad7aa60dfd77';
const deployerAddr = '0xe14d84b1DF1C205E33420ffE00bA44F85e35f791';
const rewardMassterAddr = '0x347a58878D04951588741d4d16d54B742c7f60fC';
const stakingAddr = '0xf4d06d72dACdD8393FA4eA72FdcC10049711F899';
const zkpAddr = '0x909E34d3f6124C324ac83DccA84b74398a6fa173';
const vestingPoolsAddr = '0xb476104aa9D1f30180a01987FB09b1e96dDCF14B';

const provider = ethers.provider;

let rewardMaster, stakeRewardController2, staking, zkp;

async function defineContracts() {
    zkp = new ethers.Contract(zkpAddr, getErc20BalanceOfAbi(), provider);

    const Staking = await ethers.getContractFactory('Staking');
    staking = await Staking.attach(stakingAddr, provider);

    const RewardMaster = await ethers.getContractFactory('RewardMaster');
    rewardMaster = await RewardMaster.attach(rewardMassterAddr, provider);

    return {
        rewardMaster,
        staking,
        zkp,
    };
}

async function deployStakeRewardController2() {
    await impersonate(deployerAddr);
    await ensureMinBalance(deployerAddr, '0x2c68af0bb140000'); // 0.2 ETH
    const deployer = await ethers.getSigner(deployerAddr);
    const StakeRewardController2 = await await ethers.getContractFactory(
        'StakeRewardController2',
        provider,
    );
    stakeRewardController2 = await StakeRewardController2.connect(
        deployer,
    ).deploy(
        deployer.address,
        zkpAddr,
        stakingAddr,
        rewardMassterAddr,
        stuckUnclaimed,
    );
    await unimpersonate(deployerAddr);
    return stakeRewardController2;
}

async function initializeStakeRewardController2() {
    await impersonate(daoAddr);
    await ensureMinBalance(daoAddr, '0x2c68af0bb140000'); // 0.2 ETH
    const dao = await ethers.getSigner(daoAddr);

    // Mint and vest tokens to the StakeRewardController2
    const vestingPools = new ethers.Contract(
        vestingPoolsAddr,
        getVestingPoolsMiniAbi(),
        dao,
    );
    let start = 1653868800; // 2022-05-30T00:00:00.000Z
    let vestingDays = 30;
    const sAllocation = stuckUnclaimed.div(1e12);
    await vestingPools.addVestingPools(
        [daoAddr],
        [
            {
                isPreMinted: true,
                isAdjustable: true,
                start,
                vestingDays,
                sAllocation,
                sUnlocked: sAllocation,
                vested: 0,
            },
        ],
        {from: daoAddr, gasLimit: 300000},
    );
    const poolId = 15;
    start = 1651363200; // 2022-05-01T00:00:00.000Z
    vestingDays = 1;
    await vestingPools.updatePoolTime(poolId, start, vestingDays, {
        from: daoAddr,
        gasLimit: 300000,
    });
    await vestingPools.releaseTo(
        poolId,
        stakeRewardController2.address,
        stuckUnclaimed,
        {from: daoAddr, gasLimit: 300000},
    );
    assert(
        (await zkp.balanceOf(stakeRewardController2.address)).toString() ==
            stuckUnclaimed.toString(),
        'Error: failed to vest tokens',
    );

    // Replace adviser for UNSTAKED
    assert(
        (
            await rewardMaster.rewardAdvisers(stakingAddr, unstakeAction)
        ).toLowerCase() ==
            '0x5Df8Ec95d8b96aDa2B4041D639Ab66361564B050'.toLowerCase(),
        'Err: unexpected "old" adviser',
    );
    await rewardMaster
        .connect(dao)
        .removeRewardAdviser(stakingAddr, unstakeAction, {gasLimit: 100000});
    await rewardMaster
        .connect(dao)
        .addRewardAdviser(
            stakingAddr,
            unstakeAction,
            stakeRewardController2.address,
            {gasLimit: 100000},
        );
    assert(
        (
            await rewardMaster.rewardAdvisers(stakingAddr, unstakeAction)
        ).toLowerCase() == stakeRewardController2.address.toLowerCase(),
        'Error: unexpected "replaced" adviser',
    );

    await unimpersonate(daoAddr);
}

async function testUnstake(
    stakerAddr,
    stakeId = 0,
    isFirstUnstakeOfStakerInTheTest = true,
) {
    const stake = await staking.stakes(stakerAddr, stakeId);
    assert(stake.amount.gt(0), 'Error: zero stake amount');
    assert(stake.claimedAt === 0, 'Error: stake already claimed');

    const balanceBefore = await zkp.balanceOf(stakerAddr);
    const entitledBefore = await stakeRewardController2.entitled(stakerAddr);
    const rmEntitledBefore = await rewardMaster.entitled(stakerAddr);
    const unclaimedBefore = await stakeRewardController2.unclaimedRewards();
    const stakeAndRewardAmount = entitledBefore.add(stake.amount);

    await impersonate(stakerAddr);
    await ensureMinBalance(stakerAddr, '0x2c68af0bb140000'); // 0.2 ETH
    const staker = await ethers.getSigner(stakerAddr);
    await staking
        .connect(staker)
        .unstake(stakeId, 0x00, false, {gasLimit: 300000});
    await unimpersonate(stakerAddr);

    const stakeAfter = await staking.stakes(stakerAddr, stakeId);
    const balanceAfter = await zkp.balanceOf(staker.address);
    const entitledAfter = await stakeRewardController2.entitled(stakerAddr);
    const rmEntitledAfter = await rewardMaster.entitled(stakerAddr);
    const unclaimedAfter = await stakeRewardController2.unclaimedRewards();
    const balanceChange = balanceAfter.sub(balanceBefore);
    const unclaimedChange = unclaimedBefore.sub(unclaimedAfter);

    toLog(`stakerAddr, stakeId: ${stakerAddr}, ${stakeId}`);
    toLog(JSON.stringify(stake));
    toLog(`balanceBefore:    ${balanceBefore.toString()}`);
    toLog(
        `balanceAfter:     ${balanceAfter.toString()}, dif: ${balanceChange.toString()}`,
    );
    toLog(`unclaimedBefore:  ${unclaimedBefore.toString()}`);
    toLog(
        `unclaimedAfter:   ${unclaimedAfter.toString()}, dif: ${unclaimedChange.toString()}`,
    );
    toLog(`entitledBefore:   ${entitledBefore.toString()}`);
    toLog(`entitledAfter:    ${entitledAfter.toString()}`);
    toLog(`rmEntitledBefore: ${rmEntitledBefore.toString()}`);
    toLog(`rmEntitledAfter:  ${rmEntitledAfter.toString()}`);

    assert(stakeAfter.claimedAt > 0, 'Error: stake remains unclaimed');
    if (isFirstUnstakeOfStakerInTheTest) {
        assert(
            entitledBefore.toString() == rmEntitledBefore.toString(),
            'Error: entitled mismatch',
        );
    }
    assert(
        rmEntitledAfter.toString() == rmEntitledBefore.toString(),
        'Error: rmEntitled changed',
    );
    assert(entitledAfter.toString() == '0', 'Error: non-zero entitledAfter');
    assert(
        balanceChange.toString() == stakeAndRewardAmount.toString(),
        'Error: unmatched balance change',
    );
    assert(
        unclaimedChange.toString() == entitledBefore.toString(),
        'Error: unmatched unclaimed change',
    );
}

function getVestingPoolsMiniAbi() {
    return [
        {
            type: 'function',
            name: 'addVestingPools',
            inputs: [
                {name: 'wallets', type: 'address[]'},
                {
                    components: [
                        {name: 'isPreMinted', type: 'bool'},
                        {name: 'isAdjustable', type: 'bool'},
                        {name: 'start', type: 'uint32'},
                        {name: 'vestingDays', type: 'uint16'},
                        {name: 'sAllocation', type: 'uint48'},
                        {name: 'sUnlocked', type: 'uint48'},
                        {name: 'vested', type: 'uint96'},
                    ],
                    name: 'pools',
                    type: 'tuple[]',
                },
            ],
            outputs: [],
            stateMutability: 'nonpayable',
        },
        {
            type: 'function',
            name: 'getWallet',
            inputs: [{name: 'poolId', type: 'uint256'}],
            outputs: [{name: '', type: 'address'}],
            stateMutability: 'view',
        },
        {
            type: 'function',
            name: 'releaseTo',
            inputs: [
                {name: 'poolId', type: 'uint256'},
                {name: 'account', type: 'address'},
                {name: 'amount', type: 'uint256'},
            ],
            outputs: [{name: 'released', type: 'uint256'}],
            stateMutability: 'nonpayable',
        },
        {
            type: 'function',
            name: 'updatePoolTime',
            inputs: [
                {name: 'poolId', type: 'uint256'},
                {name: 'start', type: 'uint32'},
                {name: 'vestingDays', type: 'uint16'},
            ],
            outputs: [],
            stateMutability: 'nonpayable',
        },
    ];
}

function getErc20BalanceOfAbi() {
    return [
        {
            type: 'function',
            name: 'balanceOf',
            inputs: [{name: 'account', type: 'address'}],
            outputs: [{name: '', type: 'uint256'}],
            stateMutability: 'view',
        },
    ];
}
