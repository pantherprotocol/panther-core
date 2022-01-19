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
    const hash4bytes = (s: string) => utils.arrayify(utils.id(s)).slice(0, 4);
    const stakeType = hash4bytes('classic');

    for await (const action of ['stake', 'unstake']) {
        const actionHash = hash4bytes(action);
        console.log('Action hash:', utils.hexlify(actionHash));
        console.log('Classic: ', utils.hexlify(stakeType));

        const actionType = utils
            .keccak256(utils.concat([actionHash, stakeType]))
            .slice(0, 10);
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
