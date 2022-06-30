import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {
        deployments: { deploy, get },
        getNamedAccounts,
    } = hre;
    const { deployer } = await getNamedAccounts();
    const multisig =
        process.env.DAO_MULTISIG_ADDRESS ||
        (await getNamedAccounts()).multisig ||
        deployer;

    const registry = await hre.ethers.getContract('ZAssetsRegistry_Proxy');
    const vaultProxy = await hre.ethers.getContract('Vault_Proxy');
    const grantorProxy = await hre.ethers.getContract('PrpGrantor_Proxy');

    const poseidonT3 = await get('PoseidonT3');
    const poseidonT4 = await get('PoseidonT4');
    const poseidonT6 = await get('PoseidonT6');

    const exitTime =
        process.env.POOL_EXIT_TIME || Math.ceil(Date.now() / 1000) + 60;

    let contract = 'TestnetPantherPoolV0';

    if (hre.network.name == 'mainnet' || hre.network.name == 'polygon') {
        contract = 'PantherPoolV0';
    }

    await deploy('PantherPoolV0', {
        contract,
        from: deployer,
        args: [
            multisig,
            exitTime,
            registry.address,
            vaultProxy.address,
            grantorProxy.address,
        ],
        libraries: {
            PoseidonT3: poseidonT3.address,
            PoseidonT4: poseidonT4.address,
            PoseidonT6: poseidonT6.address,
        },
        proxy: {
            proxyContract: 'EIP173Proxy',
            owner: multisig,
        },
        log: true,
        autoMine: true,
    });
};

export default func;

func.tags = ['pool'];
func.dependencies = [
    'check-params',
    'crypto-libs',
    'vault-proxy',
    'grantor-proxy',
    'registry',
];
