import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

import {isLocal} from '../../lib/checkNetwork';
import {
    reuseEnvAddress,
    getContractAddress,
    getContractEnvAddress,
    verifyUserConsentOnProd,
    fulfillLocalAddress,
} from '../../lib/deploymentHelpers';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    console.log(
        `Deploying AdvancedStakeRewardController on ${hre.network.name}...`,
    );
    await verifyUserConsentOnProd(hre, deployer);
    if (reuseEnvAddress(hre, 'ADVANCED_STAKE_REWARD_CONTROLLER')) return;

    if (isLocal(hre)) {
        if (!fulfillLocalAddress(hre, 'PNFT_TOKEN'))
            throw 'Undefined PNFT_TOKEN_LOCALHOST';
    }

    const zkpToken = getContractEnvAddress(hre, 'ZKP_TOKEN');
    const pNftToken = getContractEnvAddress(hre, 'PNFT_TOKEN');
    const rewardMaster = await getContractAddress(
        hre,
        'RewardMaster',
        'REWARD_MASTER',
    );
    const pantherPool = await getContractAddress(
        hre,
        'PantherPoolV0_Proxy',
        'PANTHER_POOL_V0_PROXY',
    );

    await deploy('AdvancedStakeRewardController', {
        from: deployer,
        args: [deployer, rewardMaster, pantherPool, zkpToken, pNftToken],
        log: true,
        autoMine: true,
    });
};
export default func;

func.tags = ['advanced-staking', 'advanced-stake-reward-controller'];
func.dependencies = ['check-params', 'reward-master', 'pool'];
