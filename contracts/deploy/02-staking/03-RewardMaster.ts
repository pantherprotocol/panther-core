import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

import {isLocal, isPolygonOrMumbai} from '../../lib/checkNetwork';
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
    if (reuseEnvAddress(hre, 'REWARD_MASTER')) return;

    let pool: string;

    if (isPolygonOrMumbai(hre) || isLocal(hre)) {
        pool = await getContractAddress(
            hre,
            'MaticRewardPool',
            'MATIC_REWARD_POOL',
        );
    } else {
        pool = await getContractAddress(hre, 'RewardPool', 'REWARD_POOL');
    }

    const zkpToken = getContractEnvAddress(hre, 'ZKP_TOKEN');

    await deploy('RewardMaster', {
        from: deployer,
        args: [zkpToken, pool, deployer],
        log: true,
        autoMine: true,
    });
};
export default func;

func.tags = ['advanced-staking', 'classic-staking', 'reward-master'];
func.dependencies = ['check-params', 'reward-pool'];
