import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer, multisig, owner } = await getNamedAccounts();

    const vaultProxy = await hre.ethers.getContract('Vault_Proxy');

    const PoseidonT3 = await hre.ethers.getContract('PoseidonT3');
    const PoseidonT4 = await hre.ethers.getContract('PoseidonT4');
    const PoseidonT6 = await hre.ethers.getContract('PoseidonT6');

    const exitTime = process.env.POOL_EXIT_TIME
        ? process.env.POOL_EXIT_TIME
        : Math.ceil(Date.now() / 1000) + 60;

    console.log(
        `Deploying PantherPoolV0 along with Proxy on ${hre.network.name}...`,
    );

    await deploy('PantherPoolV0', {
        from: deployer,
        args: [owner, exitTime, vaultProxy.address],
        libraries: {
            PoseidonT3: PoseidonT3.address,
            PoseidonT4: PoseidonT4.address,
            PoseidonT6: PoseidonT6.address,
        },
        proxy: { owner: multisig },
        log: true,
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    });
};

export default func;

func.tags = ['Pool', 'Pool-all'];
