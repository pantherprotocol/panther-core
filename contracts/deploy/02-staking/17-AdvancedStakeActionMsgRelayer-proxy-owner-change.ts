import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

import {isPolygonOrMumbai} from '../../lib/checkNetwork';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    if (
        // Deployment on Polygon or Mumbai networks supported only
        !isPolygonOrMumbai(hre)
    ) {
        console.log('Skip relayer proxy owner change...');
        return;
    }

    const {getNamedAccounts, ethers} = hre;
    const {deployer} = await getNamedAccounts();
    const multisig =
        process.env.DAO_MULTISIG_ADDRESS ||
        (await getNamedAccounts()).multisig ||
        deployer;

    const relayerProxy = await ethers.getContract(
        'AdvancedStakeActionMsgRelayer_Proxy',
    );

    const oldOwner = await relayerProxy.owner();
    if (oldOwner.toLowerCase() == multisig.toLowerCase()) {
        console.log(`Relayer_Proxy owner is already set to: ${multisig}`);
    } else {
        console.log(
            `Transferring ownership of Relayer_Proxy to ${multisig}...`,
        );

        const signer = await ethers.getSigner(deployer);
        const tx = await relayerProxy
            .connect(signer)
            .transferOwnership(multisig);

        console.log('Relayer_Proxy owner is updated, tx: ', tx.hash);
    }
};

export default func;

func.tags = ['bridge', 'msg-relayer-owner'];
// func.dependencies = ['check-params', 'msg-relayer-upgrade'];
