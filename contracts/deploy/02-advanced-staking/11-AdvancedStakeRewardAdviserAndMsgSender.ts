import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {
    reuseEnvAddress,
    getContractAddress,
    getContractEnvAddress,
} from '../../lib/deploymentHelpers';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {name: network} = hre.network;
    if (
        // Deployment on these networks supported only
        network != 'mainnet' &&
        network != 'goerli'
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

    const rewardMaster = await getContractAddress(
        hre,
        'RewardMaster',
        'REWARD_MASTER',
    );
    const msgRelayerProxy = getContractEnvAddress(
        hre,
        'ADVANCED_STAKE_ACTION_MSG_RELAYER_PROXY',
    );
    const fxRoot = getContractEnvAddress(hre, 'FX_ROOT');

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

func.tags = ['bridge', 'msg-sender'];
func.dependencies = ['check-params', 'reward-master'];
