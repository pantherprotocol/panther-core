import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {task} from 'hardhat/config';

import {
    CLASSIC,
    hash4bytes,
    classicActionHash,
    STAKE,
    UNSTAKE,
} from '../lib/hash';

const TASK_PROPOSAL_GEN = 'proposal:gen';

const J = JSON.stringify;

task(
    TASK_PROPOSAL_GEN,
    'Generate JSON for copy and paste into snapshot proposal',
).setAction(async (_taskArgs, hre: HardhatRuntimeEnvironment) => {
    if (hre.network.name !== 'mainnet') {
        console.warn(
            '\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n',
            'Not running against mainnet!  Contract addresses may be wrong.',
            '\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n',
        );
    }

    addTerms();
    await addRewardAdvisers(hre);
    await initRewardPool(hre);
});

function addTerms() {
    const terms = {
        isEnabled: true,
        isRewarded: true,
        minAmountScaled: 100, // 100 ZKP
        maxAmountScaled: 0,
        allowedSince: new Date(Date.UTC(2022, 1, 2)).getTime() / 1000, // Wed 2 Feb
        allowedTill: new Date(Date.UTC(2022, 3, 27)).getTime() / 1000, // Wed 27 Apr
        lockedTill: 0,
        exactLockPeriod: 0,
        minLockPeriod: 3600 * 24 * 7,
    };
    console.log(
        'Staking.addTerms()',
        '\n   stakeType:',
        J(hash4bytes(CLASSIC)),
        '\n   terms:',
        J(terms),
    );
}

async function addRewardAdvisers(hre: HardhatRuntimeEnvironment) {
    const staking = await hre.ethers.getContract('Staking');
    const stakeRewardAdviser = await hre.ethers.getContract(
        'StakeRewardAdviser',
    );
    const addRewardAdviser = (action: string) => {
        console.log(
            '\nRewardMaster.addRewardAdviser()',
            '\n   oracle:',
            J(staking.address),
            '\n   action:',
            J(classicActionHash(action)),
            '\n   adviser:',
            J(stakeRewardAdviser.address),
        );
    };
    addRewardAdviser(STAKE);
    addRewardAdviser(UNSTAKE);
}

async function initRewardPool(hre: HardhatRuntimeEnvironment) {
    // const rewardPool = await hre.ethers.getContract('RewardPool');
    const rewardMaster = await hre.ethers.getContract('RewardMaster');
    console.log(
        '\nRewardPool.initialize()',
        '\n   poolId:',
        12,
        '\n   recipient:',
        J(rewardMaster.address),
        '\n   endTime:',
        new Date(Date.UTC(2022, 1, 2 + 91)).getTime() / 1000, // one day after 91 days
    );
}
