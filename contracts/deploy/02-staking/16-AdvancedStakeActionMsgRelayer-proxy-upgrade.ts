import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

import {isPolygonOrMumbai} from '../../lib/checkNetwork';
import {
    getContractAddress,
    upgradeEIP1967Proxy,
} from '../../lib/deploymentHelpers';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    if (
        // Deployment on Polygon or Mumbai networks supported only
        !isPolygonOrMumbai(hre)
    ) {
        console.log('Skip relayer proxy upgrade...');
        return;
    }

    const {getNamedAccounts} = hre;
    const {deployer} = await getNamedAccounts();

    const relayerProxy = await getContractAddress(
        hre,
        'AdvancedStakeActionMsgRelayer_Proxy',
        'ADVANCED_STAKE_ACTION_MSG_RELAYER_PROXY',
    );
    const relayerImp = await getContractAddress(
        hre,
        'AdvancedStakeActionMsgRelayer_Implementation',
        'ADVANCED_STAKE_ACTION_MSG_RELAYER_PROXY_IMP',
    );

    await upgradeEIP1967Proxy(
        hre,
        deployer,
        relayerProxy,
        relayerImp,
        'AdvancedStakeActionMsgRelayer',
    );
};

export default func;

func.tags = ['bridge', 'msg-relayer-upgrade'];
func.dependencies = ['check-params', 'msg-relayer-imp'];
