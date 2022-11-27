import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

import {
    isLocal,
    isMainnetOrGoerli,
    isPolygonOrMumbai,
} from '../../lib/checkNetwork';
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

    const zkpToken = getContractEnvAddress(hre, 'ZKP_TOKEN');

    if (isPolygonOrMumbai(hre) || isLocal(hre)) {
        if (reuseEnvAddress(hre, 'MATIC_REWARD_POOL')) return;

        await deploy('MaticRewardPool', {
            from: deployer,
            args: [zkpToken, deployer],
            log: true,
            autoMine: true,
        });
    }

    if (isMainnetOrGoerli(hre)) {
        if (reuseEnvAddress(hre, 'REWARD_POOL')) return;

        const vestingPools = await getContractAddress(
            hre,
            'vestingPools',
            'VESTING_POOLS',
        );

        await deploy('RewardPool', {
            from: deployer,
            args: [vestingPools, deployer],
            log: true,
            autoMine: true,
        });
    }
};
export default func;

func.tags = ['advanced-staking', 'classic-staking', 'RewardPool'];
func.dependencies = ['check-params'];
