import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {
        deployments: { deploy },
        getNamedAccounts,
    } = hre;
    const { deployer } = await getNamedAccounts();

    const pantherPool = await hre.ethers.getContract('PantherPoolV0');

    await deploy('Vault_Implementation', {
        contract: 'Vault',
        from: deployer,
        args: [pantherPool.address],
        log: true,
        autoMine: true,
    });
};
export default func;

func.tags = ['vault-impl'];
func.dependencies = ['check-params', 'pool'];
