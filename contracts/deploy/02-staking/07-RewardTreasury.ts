import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

import {
    reuseEnvAddress,
    getContractEnvAddress,
    verifyUserConsentOnProd,
} from '../../lib/deploymentHelpers';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    await verifyUserConsentOnProd(hre, deployer);
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
func.dependencies = ['check-params'];
