import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

import {
    reuseEnvAddress,
    getContractEnvAddress,
    verifyUserConsentOnProd,
} from '../../lib/deploymentHelpers';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    await verifyUserConsentOnProd(hre, deployer);
    if (reuseEnvAddress(hre, 'ZKP_FAUCET')) return;

    const zkpToken = getContractEnvAddress(hre, 'ZKP_TOKEN');

    const tokenPrice = '0';
    const maxAmountToPay = '0';
    const cupSize = hre.ethers.utils.parseEther('1000');
    const maxDrinkCount = '0';

    await deploy('ZkpFaucet', {
        from: deployer,
        args: [
            deployer,
            zkpToken,
            tokenPrice,
            maxAmountToPay,
            cupSize,
            maxDrinkCount,
        ],
        log: true,
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    });
};
export default func;

func.tags = ['faucet'];
func.dependencies = ['check-params'];
