import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

import {
    getContractAddress,
    upgradeEIP1967Proxy,
} from '../../lib/deploymentHelpers';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {getNamedAccounts} = hre;
    const {deployer} = await getNamedAccounts();

    const grantorProxy = await getContractAddress(
        hre,
        'PrpGrantor_Proxy',
        'PRP_GRANTOR_PROXY',
    );
    const grantorImpl = await getContractAddress(
        hre,
        'PrpGrantor_Implementation',
        'PRP_GRANTOR_IMP',
    );

    await upgradeEIP1967Proxy(
        hre,
        deployer,
        grantorProxy,
        grantorImpl,
        'prpGrantor',
    );
};

export default func;

func.tags = ['grantor-upgrade', 'protocol'];
func.dependencies = ['check-params', 'grantor-impl'];
