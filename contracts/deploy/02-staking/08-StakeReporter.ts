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
    if (reuseEnvAddress(hre, 'STAKE_REPORTER')) return;

    const staking = await getContractAddress(hre, 'Staking', 'STAKING');
    const stakeRewardController = await getContractAddress(
        hre,
        'StakeRewardController',
        'STAKE_REWARD_CONTROLLER',
    );

    await deploy('StakesReporter', {
        from: deployer,
        args: [staking, stakeRewardController],
        log: true,
        autoMine: true,
    });
};
export default func;

func.tags = ['classic-staking', 'stakes-reporter'];
func.dependencies = ['check-params', 'staking', 'stake-reward-controller'];
