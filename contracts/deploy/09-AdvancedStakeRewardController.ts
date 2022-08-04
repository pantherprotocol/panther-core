import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    console.log(
        `Deploying AdvancedStakeRewardController on ${hre.network.name}...`,
    );

    const rewardMaster = await hre.ethers.getContract('RewardMaster');

    await deploy('AdvancedStakeRewardController', {
        from: deployer,
        args: [
            deployer,
            rewardMaster.address,
            process.env.PANTHER_POOL,
            process.env.PRP_GRANTOR,
            process.env.ZKP_TOKEN_ADDRESS,
            process.env.PNFT_TOKEN_ADDRESS,
        ],
        log: true,
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    });
};
export default func;

func.tags = ['AdvancedStakeRewardController'];
