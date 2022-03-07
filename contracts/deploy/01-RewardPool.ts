import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    console.log(`Deploying RewardPool on ${hre.network.name}...`);

    if (hre.network.name == 'polygon' || hre.network.name == 'mumbai') {
        console.log(`STAKING_TOKEN=${process.env.STAKING_TOKEN}`);

        await deploy('MaticRewardPool', {
            from: deployer,
            args: [process.env.STAKING_TOKEN, deployer],
            log: true,
            autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
        });
    } else {
        console.log(`VESTING_POOLS=${process.env.VESTING_POOLS}`);

        await deploy('RewardPool', {
            from: deployer,
            args: [process.env.VESTING_POOLS, deployer],
            log: true,
            autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
        });
    }
};
export default func;

func.tags = ['RewardPool'];
