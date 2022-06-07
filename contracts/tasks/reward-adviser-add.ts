import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {task, types} from 'hardhat/config';
import {addRewardAdviser} from '../lib/staking';
import {RewardMaster} from '../types/contracts';
import {Contract} from 'ethers';

async function getAdviser(
    hre: HardhatRuntimeEnvironment,
    isMainnet: boolean,
    isClassic: boolean,
) {
    let adviser: Contract;

    if (isMainnet && !isClassic) {
        throw new Error('Advanced staking is not supported on mainnet');
    }

    if (isMainnet) {
        console.log('getting adviser for mainnet...');

        adviser = await hre.ethers.getContract('StakeRewardAdviser');
    } else {
        console.log('getting adviser for polygon...');
        console.log('is classic:', isClassic);

        adviser = isClassic
            ? await hre.ethers.getContract('StakeRewardController2')
            : await hre.ethers.getContract('AdvancedStakeRewardController');
    }

    return adviser;
}

task(
    'adviser:add',
    'Adds reward controller to RewardMaster for classic/advanced staking and unstaking',
)
    .addParam('replace', 'Replace existing controller', false, types.boolean)
    .addParam(
        'mainnet',
        'Whether to add to mainnet or polygon',
        true,
        types.boolean,
    )
    .addParam(
        'classic',
        'Whether to add classic adviser or advanced',
        true,
        types.boolean,
    )
    .setAction(async (_taskArgs, hre: HardhatRuntimeEnvironment) => {
        const adviser = await getAdviser(
            hre,
            _taskArgs.mainnet,
            _taskArgs.classic,
        );

        const staking = await hre.ethers.getContract('Staking');
        const rewardMaster = (await hre.ethers.getContract(
            'RewardMaster',
        )) as RewardMaster;

        const {receipts} = await addRewardAdviser(
            rewardMaster,
            staking.address,
            adviser.address,
            {replace: _taskArgs.replace, isClassic: _taskArgs.classic},
        );

        console.log('transaction receipt:', receipts);
    });
