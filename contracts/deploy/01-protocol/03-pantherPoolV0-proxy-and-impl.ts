import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {
        deployments: {deploy, get},
        getNamedAccounts,
    } = hre;
    const {deployer} = await getNamedAccounts();
    const multisig =
        process.env.DAO_MULTISIG_ADDRESS ||
        (await getNamedAccounts()).multisig ||
        deployer;

    const registry = await hre.ethers.getContract('ZAssetsRegistry_Proxy');
    const vaultProxy = await hre.ethers.getContract('Vault_Proxy');

    const poseidonT3 = await get('PoseidonT3');
    const poseidonT4 = await get('PoseidonT4');
    const poseidonT6 = await get('PoseidonT6');

    await deploy('PantherPoolV0', {
        from: deployer,
        args: [multisig, registry.address, vaultProxy.address],
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

func.tags = ['pool', 'protocol'];
func.dependencies = [
    'check-params',
    'crypto-libs',
    'vault-proxy',
    'grantor-proxy',
    'registry',
];
