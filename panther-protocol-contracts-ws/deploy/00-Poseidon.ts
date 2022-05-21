import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log(`Deploying Poseidon libraries on ${hre.network.name}...`);

    await deploy('PoseidonT3', {
        from: deployer,
        args: [],
        libraries: {},
        log: true,
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    });

    await deploy('PoseidonT4', {
        from: deployer,
        args: [],
        libraries: {},
        log: true,
        autoMine: true,
    });

    await deploy('PoseidonT6', {
        from: deployer,
        args: [],
        libraries: {},
        log: true,
        autoMine: true,
    });
};
export default func;

func.tags = ['Poseidon', 'Pool-all'];
