import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

import {reuseEnvAddress, getContractAddress} from '../../lib/deploymentHelpers';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    if (!process.env.DEPLOY_CLASSIC_STAKING) return;
    const {deployments, getNamedAccounts} = hre;
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    console.log(`Deploying StakesReporter on ${hre.network.name}...`);
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
func.dependencies = ['staking', 'stake-reward-controller'];
