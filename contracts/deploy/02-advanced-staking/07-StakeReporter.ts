import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    if (!process.env.DEPLOY_CLASSIC_STAKING) return;
    const {deployments, getNamedAccounts} = hre;
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    const staking = await hre.ethers.getContract('Staking');
    const stakeRewardController = await hre.ethers.getContract(
        'StakeRewardController',
    );

    await deploy('StakesReporter', {
        from: deployer,
        args: [staking.address, stakeRewardController.address],
        log: true,
        autoMine: true,
    });
};
export default func;

func.tags = ['classic-staking', 'stakes-reporter'];
func.dependencies = ['staking', 'stake-reward-controller'];
