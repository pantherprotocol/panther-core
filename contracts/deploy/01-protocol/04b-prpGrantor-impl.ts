import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

import {
    reuseEnvAddress,
    getContractAddress,
    verifyUserConsentOnProd,
} from '../../lib/deploymentHelpers';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {
        deployments: {deploy},
        getNamedAccounts,
    } = hre;
    const {deployer} = await getNamedAccounts();
    await verifyUserConsentOnProd(hre, deployer);
    if (reuseEnvAddress(hre, 'PRP_GRANTOR_IMP')) return;

    const multisig =
        process.env.DAO_MULTISIG_ADDRESS ||
        (await getNamedAccounts()).multisig ||
        deployer;

    const pantherPool = await getContractAddress(
        hre,
        'PantherPoolV0_Proxy',
        'PANTHER_POOL_V0_PROXY',
    );

    await deploy('PrpGrantor_Implementation', {
        contract: 'PrpGrantor',
        from: deployer,
        args: [
            multisig, // owner
            pantherPool, // grantProcessor
        ],
        log: true,
        autoMine: true,
    });
};
export default func;

func.tags = ['grantor-impl'];
func.dependencies = ['check-params', 'pool'];
