import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

import {
    reuseEnvAddress,
    getContractAddress,
    getContractEnvAddress,
    verifyUserConsentOnProd,
} from '../../lib/deploymentHelpers';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    await verifyUserConsentOnProd(hre, deployer);
    if (reuseEnvAddress(hre, 'ADVANCED_STAKE_REWARD_CONTROLLER')) return;

    const zkpToken = getContractEnvAddress(hre, 'ZKP_TOKEN');
    const pNftToken = await getContractAddress(hre, 'PNftToken', 'PNFT_TOKEN');
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

func.tags = ['advanced-staking', 'advanced-stake-reward-controller', 'pnft'];
func.dependencies = ['check-params', 'reward-master', 'pool'];
