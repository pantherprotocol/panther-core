import {ethers} from 'hardhat';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    await deploy('StakeRewardAdviser', {
        from: deployer,
        args: ['0x' + ethers.utils.id('classic').slice(2, 10), 1e9],
        log: true,
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    });
};
export default func;

func.tags = ['classic-staking', 'StakeRewardAdviser'];
