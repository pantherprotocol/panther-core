import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

import {isPolygonOrMumbai} from '../../lib/checkNetwork';
import {
    getContractAddress,
    getContractEnvAddress,
    verifyUserConsentOnProd,
} from '../../lib/deploymentHelpers';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {
        deployments: {deploy},
        getNamedAccounts,
    } = hre;
    const {deployer} = await getNamedAccounts();

    if (
        // Deployment on Polygon or Mumbai networks supported only
        !isPolygonOrMumbai(hre)
    ) {
        console.log(
            'Skip AdvancedStakeActionMsgRelayer_Implementation deployment...',
        );
        return;
    }

    await verifyUserConsentOnProd(hre, deployer);

    const rewardMaster = await getContractAddress(
        hre,
        'RewardMaster',
        'REWARD_MASTER',
    );

    const msgSender =
        hre.network.name === 'polygon'
            ? process.env.ADVANCED_STAKE_REWARD_ADVISER_AND_MSG_SENDER_MAINNET
            : process.env.ADVANCED_STAKE_REWARD_ADVISER_AND_MSG_SENDER_GOERLI;
    const fxChild = getContractEnvAddress(hre, 'FX_CHILD');

    if (!msgSender) {
        console.log(
            'msgSender is not defined, skip relayer implementation deployment...',
        );
        return;
    }

    console.log('rewardMaster', rewardMaster);
    console.log('msgSender', msgSender);
    console.log('fxChild', fxChild);

    await deploy('AdvancedStakeActionMsgRelayer_Implementation', {
        contract: 'AdvancedStakeActionMsgRelayer',
        from: deployer,
        args: [rewardMaster, msgSender, fxChild],
        log: true,
        autoMine: true,
    });
};
export default func;

func.tags = ['bridge', 'msg-relayer-imp'];
func.dependencies = ['check-params', 'msg-relayer-proxy', 'reward-master'];
