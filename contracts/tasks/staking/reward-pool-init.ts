import {task} from 'hardhat/config';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

task('rewardpool:init', 'Initializes the RewardPool')
    .addPositionalParam('poolId', 'VestingPools pool index')
    .addPositionalParam('duration', 'RewardPool vesting duration, in seconds')
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const rewardMaster = await hre.ethers.getContract('RewardMaster');
        const rewardPool = await hre.ethers.getContract('RewardPool');

        const now = new Date().getTime() / 1000;
        const endTime = Math.floor(now + Number(taskArgs.duration));

        console.log(
            `Initializing RewardPool with`,
            `VestingPools pool id #${taskArgs.poolId},`,
            `recipient RewardMaster (${rewardMaster.address}),`,
            `duration ${taskArgs.duration},`,
            `end time ${endTime}`,
        );

        const tx = await rewardPool.initialize(
            taskArgs.poolId,
            rewardMaster.address,
            endTime,
        );

        const receipt = await tx.wait();
        console.log(`Transaction confirmed: ${receipt.transactionHash}`);
    });
