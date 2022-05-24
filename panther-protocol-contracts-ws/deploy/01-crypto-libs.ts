import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {
        deployments: { deploy },
        getNamedAccounts,
    } = hre;
    const { deployer } = await getNamedAccounts();

    await deploy('PoseidonT3', {
        from: deployer,
        args: [],
        libraries: {},
        log: true,
        autoMine: true,
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

func.tags = ['crypto-libs'];
func.dependencies = ['check-params'];
