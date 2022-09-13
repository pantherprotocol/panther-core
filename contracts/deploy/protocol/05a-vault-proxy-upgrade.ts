import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {getNamedAccounts, ethers} = hre;
    const {deployer} = await getNamedAccounts();

    const vaultProxy = await ethers.getContract('Vault_Proxy');
    const vaultImpl = await ethers.getContract('Vault_Implementation');

    // `.send` used instead of `.getStorageAt` to work w/ both `ganache-cli` and `hardhat`
    // (`.getStorageAt` fails on '0x', which `ganache-cli` returns if the slot is empty)
    const response = await ethers.provider.send('eth_getStorageAt', [
        vaultProxy.address,
        // EIP-1967 implementation slot
        '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',
    ]);
    const oldImpl: string = ethers.utils.hexZeroPad(
        ethers.utils.hexStripZeros(response),
        20,
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
