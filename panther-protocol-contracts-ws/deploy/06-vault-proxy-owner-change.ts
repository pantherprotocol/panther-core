import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, ethers } = hre;
    const { deployer } = await getNamedAccounts();
    const multisig =
        process.env.DAO_MULTISIG_ADDRESS ||
        (await getNamedAccounts()).multisig ||
        deployer;

    const vaultProxy = await ethers.getContract('Vault_Proxy');

    const oldOwner = await vaultProxy.owner();
    if (oldOwner.toLowerCase() == multisig.toLowerCase()) {
        console.log(`Vault_Proxy owner is already set to: ${multisig}`);
    } else {
        console.log(`Transferring ownership of Vault_Proxy to ${multisig}...`);

        const signer = await ethers.getSigner(deployer);
        const tx = await vaultProxy.connect(signer).transferOwnership(multisig);

        console.log('Vault_Proxy owner is updated, tx: ', tx.hash);
    }
};

export default func;

func.tags = ['vault-owner', 'pchain'];
func.dependencies = ['check-params', 'vault-upgrade'];
