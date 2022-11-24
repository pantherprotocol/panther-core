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

    console.log(`Deploying StakeRewardController on ${hre.network.name}...`);
    await verifyUserConsentOnProd(hre, deployer);
    if (reuseEnvAddress(hre, 'STAKE_REWARD_CONTROLLER')) return;

    const zkpToken = getContractEnvAddress(hre, 'ZKP_TOKEN');
    const staking = await getContractAddress(hre, 'Staking', 'STAKING');
    const rewardTreasury = await getContractAddress(
        hre,
        'RewardTreasury',
        'REWARD_TREASURY',
    );
    const rewardMaster = await getContractAddress(
        hre,
        'RewardMaster',
        'REWARD_MASTER',
    );

    await deploy('StakeRewardController', {
        from: deployer,
        args: [
            deployer, // owner
            zkpToken,
            staking,
            rewardTreasury,
            rewardMaster,
            deployer, //  history_provider,
            1646697599, // REWARDING_START - beginning of MaticRewardPool vesting
        ],
        log: true,
        autoMine: true,
    });
};
export default func;

func.tags = ['classic-staking', 'stake-reward-controller'];
func.dependencies = ['check-params'];
