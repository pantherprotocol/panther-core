import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

import {isMainnetOrGoerli} from '../../lib/checkNetwork';
import {
    reuseEnvAddress,
    getContractAddress,
    getContractEnvAddress,
    verifyUserConsentOnProd,
} from '../../lib/deploymentHelpers';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    if (
        // Deployment on Mainnet or Goerli networks supported only
        !isMainnetOrGoerli(hre)
    ) {
        console.log(
            'Skip AdvancedStakeRewardAdviserAndMsgSender deployment...',
        );
        return;
    }

    if (reuseEnvAddress(hre, 'ADVANCED_STAKE_REWARD_ADVISER_AND_MSG_SENDER'))
        return;

    const {
        deployments: {deploy},
        getNamedAccounts,
    } = hre;
    const {deployer} = await getNamedAccounts();

    await verifyUserConsentOnProd(hre, deployer);

    const rewardMaster = await getContractAddress(
        hre,
        'RewardMaster',
        'REWARD_MASTER',
    );

    const msgRelayerProxy =
        hre.network.name === 'mainnet'
            ? process.env.ADVANCED_STAKE_ACTION_MSG_RELAYER_PROXY_POLYGON
            : process.env.ADVANCED_STAKE_ACTION_MSG_RELAYER_PROXY_MUMBAI;

    const fxRoot = getContractEnvAddress(hre, 'FX_ROOT');

    if (!msgRelayerProxy) {
        console.log(
            'message relayer proxy is not defined, skip message sender deployment...',
        );
        return;
    }

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

func.tags = ['bridge', 'msg-sender'];
func.dependencies = ['check-params', 'reward-master'];
