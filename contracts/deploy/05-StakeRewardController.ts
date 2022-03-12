import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    await deploy('StakeRewardController', {
        from: deployer,
        args: [
            deployer, // owner
            process.env.TOKEN_ADDRESS,
            process.env.STAKING_CONTRACT,
            process.env.REWARD_TREASURY,
            process.env.REWARD_MASTER,
            deployer, //  history_provider,
            Math.floor(new Date().getTime() / 1000) + 30,
        ],
        log: true,
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    });
};
export default func;

func.tags = ['StakeRewardController'];
