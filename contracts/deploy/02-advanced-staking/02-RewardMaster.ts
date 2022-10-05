import {Contract} from 'ethers';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    let pool: Contract;

    if (hre.network.name == 'polygon' || hre.network.name == 'mumbai') {
        pool = await hre.ethers.getContract('MaticRewardPool');
    } else {
        pool = await hre.ethers.getContract('RewardPool');
    }

    await deploy('RewardMaster', {
        from: deployer,
        args: [process.env.ZKP_TOKEN_ADDRESS, pool.address, deployer],
        log: true,
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    });
};
export default func;

func.tags = ['advanced-staking', 'classic-staking', 'RewardMaster'];
func.dependencies = ['RewardPool'];
