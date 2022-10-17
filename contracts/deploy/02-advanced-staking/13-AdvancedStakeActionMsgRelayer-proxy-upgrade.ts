import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {name: network} = hre.network;
    if (
        // Deployment on these networks supported only
        network != 'polygon' &&
        network != 'mumbai'
    ) {
        console.log('Skip relayer proxy upgrade...');
        return;
    }

    const {getNamedAccounts, ethers} = hre;
    const {deployer} = await getNamedAccounts();

    let relayerProxy, relayerImp;

    try {
        relayerProxy = await ethers.getContract(
            'AdvancedStakeActionMsgRelayer_Proxy',
        );
        relayerImp = await ethers.getContract(
            'AdvancedStakeActionMsgRelayer_Implementation',
        );
    } catch (error: any) {
        console.log('skip proxy upgrade:', error.message);

        return;
    }

    // `.send` used instead of `.getStorageAt` to work w/ both `ganache-cli` and `hardhat`
    // (`.getStorageAt` fails on '0x', which `ganache-cli` returns if the slot is empty)
    const response = await ethers.provider.send('eth_getStorageAt', [
        relayerProxy.address,
        // EIP-1967 implementation slot
        '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',
    ]);
    const oldImpl: string = ethers.utils.hexZeroPad(
        ethers.utils.hexStripZeros(response),
        20,
    );
    if (oldImpl == relayerImp.address.toLowerCase()) {
        console.log(
            `Relayer_Proxy already set to Relayer_Implementation: ${relayerImp.address}`,
        );
    } else {
        console.log(
            `Upgrading Relayer_Proxy to new Relayer_Implementation: ${relayerImp.address}...`,
        );

        const signer = await ethers.getSigner(deployer);
        const tx = await relayerProxy
            .connect(signer)
            .upgradeTo(relayerImp.address);
        console.log('Relayer_Proxy is upgraded, tx: ', tx.hash);
    }
};

export default func;

func.tags = ['bridge', 'msg-relayer-upgrade'];
func.dependencies = ['check-params', 'msg-relayer-imp'];
