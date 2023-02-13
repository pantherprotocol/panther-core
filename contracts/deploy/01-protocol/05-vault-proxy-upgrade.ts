import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

import {
    getContractAddress,
    upgradeEIP1967Proxy,
} from '../../lib/deploymentHelpers';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {getNamedAccounts} = hre;
    const {deployer} = await getNamedAccounts();

    const vaultProxy = await getContractAddress(
        hre,
        'Vault_Proxy',
        'VAULT_PROXY',
    );
    const vaultImpl = await getContractAddress(
        hre,
        'Vault_Implementation',
        'VAULT_IMP',
    );

    await upgradeEIP1967Proxy(hre, deployer, vaultProxy, vaultImpl, 'vault');
};

export default func;

func.tags = ['vault-upgrade', 'protocol'];
func.dependencies = ['check-params', 'vault-impl'];
