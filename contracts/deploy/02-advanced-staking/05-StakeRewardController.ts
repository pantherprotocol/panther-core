import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    if (!process.env.DEPLOY_CLASSIC_STAKING) return;
    const {deployments, getNamedAccounts} = hre;
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    await deploy('StakeRewardController', {
        from: deployer,
        args: [
            deployer, // owner
            process.env.ZKP_TOKEN_ADDRESS,
            process.env.STAKING_CONTRACT,
            process.env.REWARD_TREASURY,
            process.env.REWARD_MASTER,
            deployer, //  history_provider,
            1646697599, // REWARDING_START - beginning of MaticRewardPool vesting
        ],
        log: true,
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    });
};
export default func;

func.tags = ['classic-staking', 'StakeRewardController'];
