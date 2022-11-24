import {task, types} from 'hardhat/config';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

import {updateZkpRewardsLimit, setNftRewardLimit} from '../../lib/staking';

import {AdvancedStakeRewardController} from './../../types/contracts/AdvancedStakeRewardController';

const TASK_REWARDS_LIMIT_ADD = 'rewards:limit:add';

task(
    TASK_REWARDS_LIMIT_ADD,
    'Adds ZKP rewards limit for the AdvancedStakeRewardsController contract',
)
    .addOptionalParam(
        'nftLimit',
        'The maximum NFT that can be minted by the controller as reward',
        undefined,
        types.int,
    )
    .addOptionalParam(
        'zkpLimit',
        'Whether task updates the ZKP reward limit',
        true,
        types.boolean,
    )
    .setAction(async (_taskArgs, hre: HardhatRuntimeEnvironment) => {
        const controller = (await hre.ethers.getContract(
            'AdvancedStakeRewardController',
        )) as AdvancedStakeRewardController;

        if (_taskArgs.zkpLimit) await updateZkpRewardsLimit(controller);

        if (_taskArgs.nftLimit)
            await setNftRewardLimit(controller, _taskArgs.nftLimit);
    });
