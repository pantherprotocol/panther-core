import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    console.log(`Deploying ZKP Faucet on ${hre.network.name}...`);

    const tokenPrice = '0';
    const maxAmountToPay = '0';
    const cupSize = hre.ethers.utils.parseEther('1000');
    const maxDrinkCount = '0';

    await deploy('ZkpFaucet', {
        from: deployer,
        args: [
            deployer,
            process.env.TOKEN_ADDRESS,
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

func.tags = ['ZkpFaucet'];
