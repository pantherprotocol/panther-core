import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {task} from 'hardhat/config';
import {utils} from 'ethers';

import {
    hash4bytesArray,
    classicActionHash,
    CLASSIC,
    STAKE,
    UNSTAKE,
} from '../lib/hash';

const TASK_ADVISER_ADD = 'adviser:add';

task(
    TASK_ADVISER_ADD,
    'Adds adviser to RewardMaster for classic staking and unstaking',
).setAction(async (_taskArgs, hre: HardhatRuntimeEnvironment) => {
    const stakeRewardAdviser = await hre.ethers.getContract(
        'StakeRewardAdviser',
    );
    const staking = await hre.ethers.getContract('Staking');
    const rewardMaster = await hre.ethers.getContract('RewardMaster');
    const stakeType = hash4bytesArray(CLASSIC);

    for await (const action of [STAKE, UNSTAKE]) {
        const actionHash = hash4bytesArray(action);
        console.log('Action hash:', utils.hexlify(actionHash));
        console.log('Classic: ', utils.hexlify(stakeType));

        const actionType = classicActionHash(action);
        console.log('Action type: ', actionType);

        const tx = await rewardMaster.addRewardAdviser(
            staking.address,
            actionType,
            stakeRewardAdviser.address,
        );

        const receipt = await tx.wait();
        console.log(
            `${action} transaction receipt: ${receipt.transactionHash}`,
        );
    }
});
