import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

import {
    reuseEnvAddress,
    getContractEnvAddress,
} from '../../lib/deploymentHelpers';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    console.log(`Deploying RewardTreasury on ${hre.network.name}...`);
    if (reuseEnvAddress(hre, 'REWARD_TREASURY')) return;

    const zkpToken = getContractEnvAddress(hre, 'ZKP_TOKEN');

    await deploy('RewardTreasury', {
        from: deployer,
        args: [
            deployer, // owner
            zkpToken,
        ],
        log: true,
        autoMine: true,
    });
};
export default func;

func.tags = ['classic-staking', 'reward-treasury'];
