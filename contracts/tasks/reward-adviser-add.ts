import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {task} from 'hardhat/config';
import {utils} from 'ethers';

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
    const hash4bytes = (s: string) => utils.id(s).slice(2, 10);

    for await (const action of ['stake', 'unstake']) {
        const actionType =
            '0x' + hash4bytes(hash4bytes(action) + hash4bytes('classic'));

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
