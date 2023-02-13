import {ethers} from 'hardhat';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

import {
    reuseEnvAddress,
    verifyUserConsentOnProd,
} from '../../lib/deploymentHelpers';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    await verifyUserConsentOnProd(hre, deployer);
    if (reuseEnvAddress(hre, 'STAKE_REWARD_ADVISER')) return;

    await deploy('StakeRewardAdviser', {
        from: deployer,
        args: ['0x' + ethers.utils.id('classic').slice(2, 10), 1e9],
        log: true,
        autoMine: true,
    });
};
export default func;

func.tags = ['classic-staking', 'stake-reward-adviser'];
func.dependencies = ['check-params'];
