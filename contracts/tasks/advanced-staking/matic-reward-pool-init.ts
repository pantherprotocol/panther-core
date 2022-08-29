import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {task} from 'hardhat/config';

task('maticrewardpool:init', 'Initializes the RewardPool')
    .addPositionalParam('duration', 'RewardPool vesting duration, in seconds')
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const rewardMaster = await hre.ethers.getContract('RewardMaster');
        const rewardPool = await hre.ethers.getContract('MaticRewardPool');

        const now = Math.floor(new Date().getTime() / 1000);
        const endTime = Math.floor(now + Number(taskArgs.duration));

        console.log(
            `Initializing MaticRewardPool with`,
            `recipient RewardMaster (${rewardMaster.address}),`,
            `start time ${now},`,
            `end time ${endTime}`,
        );

        const tx = await rewardPool.initialize(
            rewardMaster.address,
            now,
            endTime,
        );

        const receipt = await tx.wait();
        console.log(`Transaction confirmed: ${receipt.transactionHash}`);
    });
