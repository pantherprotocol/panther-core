import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    let contract = 'TestnetStaking';

    if (hre.network.name == 'mainnet' || hre.network.name == 'polygon') {
        contract = 'Staking';
    }

    const master = await hre.ethers.getContract('RewardMaster');

    await deploy('Staking', {
        contract,
        from: deployer,
        args: [process.env.ZKP_TOKEN_ADDRESS, master.address, deployer],
        log: true,
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    });
};

export default func;

func.tags = ['Staking'];
