import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {isLocal} from '../lib/hardhat';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    if (!process.env.DEPLOY_BRIDGE) {
        console.log('Skip bridge deployment...');
        return;
    }

    const {
        deployments: {deploy},
        ethers,
        getNamedAccounts,
    } = hre;
    const {deployer} = await getNamedAccounts();

    const {name: network} = hre.network;

    if (network == 'polygon' || network == 'mumbai') {
        await deploy('AdvancedStakeActionMsgRelayer_Proxy', {
            contract: 'EIP173Proxy',
            from: deployer,
            args: [
                ethers.constants.AddressZero, // implementation will be changed
                deployer,
                [], // data
            ],
            log: true,
            autoMine: true,
        });
    } else if (isLocal(hre)) {
        console.log('Skip the bridge deployment for local network...');
    }
};
export default func;

func.tags = ['msg-relayer-proxy'];
