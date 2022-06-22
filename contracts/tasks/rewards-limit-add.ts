import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {task} from 'hardhat/config';

const TASK_REWARDS_LIMIT_ADD = 'rewards:limit:add';

task(
    TASK_REWARDS_LIMIT_ADD,
    'Adds ZKP rewards limit for the AdvancedStakeRewardsController contract',
).setAction(async (_taskArgs, hre: HardhatRuntimeEnvironment) => {
    const controller = await hre.ethers.getContract(
        'AdvancedStakeRewardController',
    );

    const tx = await controller.setZkpRewardsLimit();
    const receipt = await tx.wait();
    console.log('rewardsLimit transaction receipt:', receipt);
});
