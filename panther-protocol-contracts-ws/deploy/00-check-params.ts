import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, network } = hre;

    console.log(`Deploying on ${network.name}...`);

    const { deployer } = await getNamedAccounts();
    if (!deployer) throw 'Err: deployer undefined';

    // network.live seems to not work
    const isLocal: boolean = !!network.name.match(/^hardhat|pchain$/);
    if (!isLocal) {
        if (!process.env.DAO_MULTISIG_ADDRESS)
            throw 'Undefined DAO_MULTISIG_ADDRESS';
        if (!process.env.POOL_EXIT_TIME) throw 'Undefined POOL_EXIT_TIME';
    }
};

export default func;

func.tags = ['check-params'];
