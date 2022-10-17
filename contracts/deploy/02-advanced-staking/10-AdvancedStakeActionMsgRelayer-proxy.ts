import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {reuseEnvAddress} from '../../lib/deploymentHelpers';

import {verifyUserConsentOnProd} from '../../lib/deploymentHelpers';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {name: network} = hre.network;
    if (
        // Deployment on these networks supported only
        network != 'polygon' &&
        network != 'mumbai'
    ) {
        console.log('Skip AdvancedStakeActionMsgRelayer_Proxy deployment...');
        return;
    }

    if (reuseEnvAddress(hre, 'ADVANCED_STAKE_ACTION_MSG_RELAYER_PROXY')) return;

    const {
        deployments: {deploy},
        ethers,
        getNamedAccounts,
    } = hre;
    const {deployer} = await getNamedAccounts();

    console.log(
        `Deploying AdvancedStakeActionMsgRelayer_Proxy on ${hre.network.name}...`,
    );
    await verifyUserConsentOnProd(hre, deployer);

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
};
export default func;

func.tags = ['bridge', 'msg-relayer-proxy'];
func.dependencies = ['check-params'];
