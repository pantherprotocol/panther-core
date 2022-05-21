import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const vaultProxy = await hre.ethers.getContract('Vault_Proxy');
    const vault = await hre.ethers.getContract('Vault');

    console.log(
        `Upgrade Vault Proxy to new vault implementation: ${vault.address}...`,
    );

    const tx = await vaultProxy.upgradeTo(vault.address);

    console.log('Vault proxy is upgraded, tx: ', tx.hash);
};

export default func;

func.tags = ['Vault', 'Pool-all'];
