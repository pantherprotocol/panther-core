import {HardhatRuntimeEnvironment, TaskArguments} from 'hardhat/types';
import {task} from 'hardhat/config';
import {addRewardAdviser} from '../lib/staking';
import {RewardMaster} from '../types/contracts';
import {Contract} from 'ethers';

const TASK_ADVISER_ADD = 'adviser:add';

function logAdviserSpec({
    mainnet,
    classic,
    adviser,
}: {
    mainnet: boolean;
    classic: boolean;
    adviser: string;
}) {
    const type = classic ? 'classic' : 'advanced';
    const network = mainnet ? 'mainnet' : 'polygon';

    console.log(
        `Using ${adviser} for ${type} staking type on ${network} network`,
    );
}

async function getAdviser(
    hre: HardhatRuntimeEnvironment,
    {
        mainnet,
        classic,
    }: {
        [key: string]: boolean;
    },
) {
    let adviser: Contract;

    if (mainnet) {
        adviser = classic
            ? await hre.ethers.getContract('StakeRewardAdviser')
            : await hre.ethers.getContract(
                  'AdvancedStakeRewardAdviserAndMsgSender',
              );
    } else {
        adviser = classic
            ? await hre.ethers.getContract('StakeRewardController2')
            : await hre.ethers.getContract('AdvancedStakeRewardController');
    }

    logAdviserSpec({mainnet, classic, adviser: adviser.address});

    return adviser.address;
}

async function getOracle(hre: HardhatRuntimeEnvironment, relayer: boolean) {
    const oracle: Contract = relayer
        ? await hre.ethers.getContract('AdvancedStakeActionMsgRelayer_Proxy')
        : await hre.ethers.getContract('Staking');

    console.log(`Using ${oracle.address} oracle`);

    return oracle.address;
}

task(
    TASK_ADVISER_ADD,
    'Adds reward adviser to RewardMaster for classic/advanced staking and unstaking',
)
    .addFlag('replace', 'Replace existing adviser')
    .addFlag(
        'relayer',
        'Whether to use msgRelayer or Staking contract as oracle',
    )
    .addFlag(
        'mainnet',
        'Whether to add adviser to rewardMaster contract on mainnet or polygon',
    )
    .addFlag('classic', 'Whether to add classic adviser or advanced')
    .setAction(
        async (_taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment) => {
            const adviser = await getAdviser(hre, _taskArgs);
            const oracle = await getOracle(hre, _taskArgs.relayer);

            const rewardMaster = (await hre.ethers.getContract(
                'RewardMaster',
            )) as RewardMaster;

            const {receipts} = await addRewardAdviser(
                rewardMaster,
                oracle,
                adviser,
                {replace: _taskArgs.replace, isClassic: _taskArgs.classic},
            );

            console.log('transaction receipts:', receipts);
        },
    );
