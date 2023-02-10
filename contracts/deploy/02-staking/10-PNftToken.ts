import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

import {isProd} from '../../lib/checkNetwork';
import {
    reuseEnvAddress,
    verifyUserConsentOnProd,
} from '../../lib/deploymentHelpers';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    await verifyUserConsentOnProd(hre, deployer);
    if (reuseEnvAddress(hre, 'PNFT_TOKEN')) return;

    let owner: string;

    if (isProd(hre))
        owner =
            process.env.DAO_MULTISIG_ADDRESS ||
            (await getNamedAccounts()).multisig;
    else owner = deployer;

    const name = 'Panther NFT';
    const symbol = 'PNFT';

    await deploy('PNftToken', {
        from: deployer,
        args: [owner, name, symbol],
        log: true,
        autoMine: true,
    });
};
export default func;

func.tags = ['advanced-staking', 'pnft'];
func.dependencies = ['check-params'];
