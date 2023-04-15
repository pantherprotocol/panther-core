import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

import {
    reuseEnvAddress,
    getContractAddress,
    verifyUserConsentOnProd,
} from '../../lib/deploymentHelpers';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    await verifyUserConsentOnProd(hre, deployer);

    if (reuseEnvAddress(hre, 'ADVANCED_STAKE_V2_ACTION_MSG_TRANSLATOR')) return;

    const rewardMaster = await getContractAddress(
        hre,
        'RewardMaster',
        'REWARD_MASTER',
    );

    await deploy('AdvancedStakeActionMsgTranslator', {
        from: deployer,
        args: [rewardMaster],
        log: true,
        autoMine: true,
    });
};

export default func;

func.tags = ['advanced-staking', 'advanced-stake-v2-action-translator'];
func.dependencies = ['check-params', 'reward-master'];
