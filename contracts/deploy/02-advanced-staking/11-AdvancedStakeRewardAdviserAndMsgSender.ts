import {ethers} from 'hardhat';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

import resources from './resources.json';

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
    const {name: network} = hre.network;
    if (
        !process.env.DEPLOY_BRIDGE ||
        // Deployment on these networks supported only
        (network != 'mainnet' && network != 'goerli')
    ) {
        console.log('Skip bridge deployment...');
        return;
    }

    const {
        deployments: {deploy},
        getNamedAccounts,
    } = hre;
    const {deployer} = await getNamedAccounts();

    const {rewardMaster, msgRelayerProxy, fxRoot} = await getParams(network);

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
};
export default func;

func.tags = ['msg-sender'];
