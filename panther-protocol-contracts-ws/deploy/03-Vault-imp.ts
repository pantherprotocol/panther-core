import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log(`Deploying New Vault Implementation on ${hre.network.name}...`);

    const pantherPool = await hre.ethers.getContract('PantherPoolV0');

    await deploy('Vault', {
        from: deployer,
        args: [pantherPool.address],
        log: true,
        autoMine: true,
    });
};
export default func;

func.tags = ['Vault', 'Pool-all'];
