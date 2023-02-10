import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

import {
    reuseEnvAddress,
    getContractAddress,
    getContractEnvAddress,
    verifyUserConsentOnProd,
    upgradeEIP1967Proxy,
} from '../../lib/deploymentHelpers';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {
        deployments: {deploy, get},
        getNamedAccounts,
    } = hre;
    const {deployer} = await getNamedAccounts();
    await verifyUserConsentOnProd(hre, deployer);

    const multisig =
        process.env.DAO_MULTISIG_ADDRESS ||
        (await getNamedAccounts()).multisig ||
        deployer;

    const registry = await getContractAddress(
        hre,
        'ZAssetsRegistry_Proxy',
        'Z_ASSET_REGISTRY_PROXY',
    );
    const vaultProxy = await getContractAddress(
        hre,
        'Vault_Proxy',
        'VAULT_PROXY',
    );

    const poseidonT3 =
        getContractEnvAddress(hre, 'POSEIDON_T3') ||
        (await get('PoseidonT3')).address;
    const poseidonT4 =
        getContractEnvAddress(hre, 'POSEIDON_T4') ||
        (await get('PoseidonT4')).address;

    const constructorArgs = [multisig, registry, vaultProxy];
    const libraries = {
        PoseidonT3: poseidonT3,
        PoseidonT4: poseidonT4,
    };

    if (reuseEnvAddress(hre, 'PANTHER_POOL_V0_PROXY')) {
        if (reuseEnvAddress(hre, 'PANTHER_POOL_V0_IMP')) return;
        else {
            await deploy('PantherPoolV0_Implementation', {
                contract: 'PantherPoolV0',
                from: deployer,
                args: constructorArgs,
                libraries,
                log: true,
                autoMine: true,
            });

            const pantherPoolV0Proxy = getContractEnvAddress(
                hre,
                'PANTHER_POOL_V0_PROXY',
            ) as string;

            const pantherPoolV0Impl = await hre.ethers.getContract(
                'PantherPoolV0_Implementation',
            );

            console.log(pantherPoolV0Impl.address);

            await upgradeEIP1967Proxy(
                hre,
                deployer,
                pantherPoolV0Proxy,
                pantherPoolV0Impl.address,
                'pantherPool',
            );
        }
    } else {
        await deploy('PantherPoolV0', {
            from: deployer,
            args: constructorArgs,
            libraries,
            proxy: {
                proxyContract: 'EIP173Proxy',
                owner: multisig,
            },
            log: true,
            autoMine: true,
        });
    }
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
