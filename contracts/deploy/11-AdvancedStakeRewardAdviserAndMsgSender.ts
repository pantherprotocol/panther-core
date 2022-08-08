import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {ethers} from 'hardhat';
import resources from '../resources.json';
import {isLocal} from '../lib/hardhat';

const getParams = async (network: string) => {
    const msgRelayerProxy = process.env.ADVANCED_STAKE_ACTION_MSG_RELAYER_PROXY;
    const rewardMaster = (await ethers.getContract('RewardMaster')).address;
    const fxRoot = resources.addresses.fxRoot[network as 'mainnet' | 'goerli'];

    return {
        msgRelayerProxy,
        rewardMaster,
        fxRoot,
    };
};

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    if (!process.env.DEPLOY_BRIDGE) {
        console.log('Skip bridge deployment...');
        return;
    }

    const {
        deployments: {deploy},
        getNamedAccounts,
    } = hre;
    const {deployer} = await getNamedAccounts();

    const {name: network} = hre.network;

    if (network == 'mainnet' || network == 'goerli') {
        const {rewardMaster, msgRelayerProxy, fxRoot} = await getParams(
            network,
        );

        if (!msgRelayerProxy) {
            console.log(
                'message relayer proxy is not defined, skip message sender deployment...',
            );
            return;
        }

        console.log('deploying message relayer implementation...');

        console.log('rewardMaster', rewardMaster);
        console.log('msgRelayerProxy', msgRelayerProxy);
        console.log('fxRoot', fxRoot);

        await deploy('AdvancedStakeRewardAdviserAndMsgSender', {
            contract: 'AdvancedStakeRewardAdviserAndMsgSender',
            from: deployer,
            args: [rewardMaster, msgRelayerProxy, fxRoot],
            log: true,
            autoMine: true,
        });
    } else if (isLocal(hre)) {
        console.log('Skip the bridge deployment for local network...');
    }
};
export default func;

func.tags = ['msg-sender'];
