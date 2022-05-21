import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts } = hre;
    const { multisig } = await getNamedAccounts();

    const vaultProxy = await hre.ethers.getContract('Vault_Proxy');

    console.log(`Transfer Ownership of Vault Proxy to ${multisig}...`);

    const tx = await vaultProxy.transferOwnership(multisig);

    console.log('Vault proxy owner is updated, tx: ', tx.hash);
};

export default func;

func.tags = ['Vault', 'Pool-all'];
