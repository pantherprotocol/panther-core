import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, ethers } = hre;
    const { deployer } = await getNamedAccounts();
    const multisig =
        process.env.DAO_MULTISIG_ADDRESS ||
        (await getNamedAccounts()).multisig ||
        deployer;

    const grantorProxy = await ethers.getContract('PrpGrantor_Proxy');

    const oldOwner = await grantorProxy.owner();
    if (oldOwner.toLowerCase() == multisig.toLowerCase()) {
        console.log(`PrpGrantor_Proxy owner is already set to: ${multisig}`);
    } else {
        console.log(
            `Transferring ownership of PrpGrantor_Proxy to ${multisig}...`,
        );

        const signer = await ethers.getSigner(deployer);
        const tx = await grantorProxy
            .connect(signer)
            .transferOwnership(multisig);

        console.log('PrpGrantor_Proxy owner is updated, tx: ', tx.hash);
    }
};

export default func;

func.tags = ['grantor-owner', 'pchain'];
func.dependencies = ['check-params', 'grantor-upgrade'];
