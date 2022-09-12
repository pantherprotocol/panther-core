import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {getNamedAccounts, ethers} = hre;
    const {deployer} = await getNamedAccounts();

    const grantorProxy = await ethers.getContract('PrpGrantor_Proxy');
    const grantorImpl = await ethers.getContract('PrpGrantor_Implementation');

    // `.send` used instead of `.getStorageAt` to work w/ both `ganache-cli` and `hardhat`
    // (`.getStorageAt` fails on '0x', which `ganache-cli` returns if the slot is empty)
    const response = await ethers.provider.send('eth_getStorageAt', [
        grantorProxy.address,
        // EIP-1967 implementation slot
        '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',
    ]);
    const oldImpl: string = ethers.utils.hexZeroPad(
        ethers.utils.hexStripZeros(response),
        20,
    );
    if (oldImpl == grantorImpl.address.toLowerCase()) {
        console.log(
            `PrpGrantor_Proxy already set to PrpGrantor_Implementation: ${grantorImpl.address}`,
        );
    } else {
        console.log(
            `Upgrading PrpGrantor_Proxy to new PrpGrantor_Implementation: ${grantorImpl.address}...`,
        );

        const signer = await ethers.getSigner(deployer);
        const tx = await grantorProxy
            .connect(signer)
            .upgradeTo(grantorImpl.address);
        console.log('PrpGrantor_Proxy is upgraded, tx: ', tx.hash);
    }
};

export default func;

func.tags = ['grantor-upgrade'];
func.dependencies = ['check-params', 'grantor-impl'];
