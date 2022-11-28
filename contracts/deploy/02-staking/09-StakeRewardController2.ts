import {utils} from 'ethers';
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

    await verifyUserConsentOnProd(hre, deployer);
    if (reuseEnvAddress(hre, 'STAKE_REWARD_CONTROLLER_2')) return;

    const zkpToken = getContractEnvAddress(hre, 'ZKP_TOKEN');
    const staking = await getContractAddress(hre, 'Staking', 'STAKING');
    const rewardMaster = await getContractAddress(
        hre,
        'RewardMaster',
        'REWARD_MASTER',
    );

    await deploy('StakeRewardController2', {
        from: deployer,
        args: [
            process.env.DAO_MULTISIG_ADDRESS, // owner
            zkpToken,
            staking,
            rewardMaster,
            utils.parseEther(String(3.555666824442e6)),
        ],
        gasLimit: 1e6,
        log: true,
        autoMine: true,
    });
};
export default func;

func.tags = ['classic-staking', 'stake-reward-controller-2'];
func.dependencies = ['check-params'];
