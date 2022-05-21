import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log(`Deploying Vault Proxy on ${hre.network.name}...`);

    await deploy('Vault', {
        from: deployer,
        args: [deployer], // just a placeholder owner
        proxy: {
            owner: deployer, // it will be changed to multisig address
        },
        log: true,
        autoMine: true,
    });
};
export default func;

func.tags = ['Vault', 'Pool-all'];
