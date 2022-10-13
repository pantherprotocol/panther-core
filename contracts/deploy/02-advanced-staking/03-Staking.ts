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

    console.log(`Deploying Staking on ${hre.network.name}...`);
    await verifyUserConsentOnProd(hre, deployer);
    if (reuseEnvAddress(hre, 'STAKING')) return;

    let contract = 'TestnetStaking';

    if (hre.network.name == 'mainnet' || hre.network.name == 'polygon') {
        contract = 'Staking';
    }

    const zkpToken = getContractEnvAddress(hre, 'ZKP_TOKEN');
    const rewardMaster = await getContractAddress(
        hre,
        'RewardMaster',
        'REWARD_MASTER',
    );

    await deploy('Staking', {
        contract,
        from: deployer,
        args: [zkpToken, rewardMaster, deployer],
        log: true,
        autoMine: true,
    });
};

export default func;

func.tags = ['advanced-staking', 'classic-staking', 'staking'];
func.dependencies = ['reward-master'];
