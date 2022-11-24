import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

import {
    reuseEnvAddress,
    getContractEnvAddress,
    verifyUserConsentOnProd,
} from '../../lib/deploymentHelpers';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    console.log(`Deploying PNFT on ${hre.network.name}...`);
    await verifyUserConsentOnProd(hre, deployer);
    if (reuseEnvAddress(hre, 'PNFT_TOKEN')) return;

    const proxyRegistry = getContractEnvAddress(
        hre,
        'OPENSEA_ERC721_PROXY_REGISTRY',
    );
    const name = 'Panther NFT';
    const symbol = 'PNFT';

    await deploy('PNftToken', {
        from: deployer,
        args: [proxyRegistry, name, symbol],
        log: true,
        autoMine: true,
    });
};
export default func;

func.tags = ['advanced-staking', 'pnft'];
func.dependencies = ['check-params'];
