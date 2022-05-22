import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, ethers } = hre;
    const { deployer } = await getNamedAccounts();

    const vaultProxy = await ethers.getContract('Vault_Proxy');
    const vaultImpl = await ethers.getContract('Vault_Implementation');

    // Get EIP-1967 implementation slot data
    const oldImpl: string = ethers.utils.hexStripZeros(
        await ethers.provider.getStorageAt(
            vaultProxy.address,
            '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',
        ),
    );
    if (oldImpl == vaultImpl.address.toLowerCase()) {
        console.log(
            `Vault_Proxy already set to Vault_Implementation: ${vaultImpl.address}`,
        );
    } else {
        console.log(
            `Upgrading Vault_Proxy to new Vault_Implementation: ${vaultImpl.address}...`,
        );

        const signer = await ethers.getSigner(deployer);
        const tx = await vaultProxy
            .connect(signer)
            .upgradeTo(vaultImpl.address);
        console.log('Vault_Proxy is upgraded, tx: ', tx.hash);
    }
};

export default func;

func.tags = ['vault-upgrade'];
func.dependencies = ['check-params', 'vault-impl'];
