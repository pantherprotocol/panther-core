import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    console.log(
        `Deploying AdvancedStakingDataDecoder on ${hre.network.name}...`,
    );

    const rewardMaster = await hre.ethers.getContract('RewardMaster');
    const rewardingStart =
        process.env.ADVANCED_REWARDING_START ||
        Math.ceil(Date.now() / 1000) + 120;

    const rewardedPeriod = process.env.ADVANCED_REWARDED_PERIOD;

    console.log(`Rewarding start: ${rewardingStart}`);
    console.log(`Rewarded period: ${rewardedPeriod}`);

    await deploy('AdvancedStakingDataDecoder', {
        from: deployer,
        args: [
            deployer,
            rewardMaster.address,
            process.env.PANTHER_POOL,
            process.env.TOKEN_ADDRESS,
            hre.ethers.constants.AddressZero,
            rewardingStart,
            rewardedPeriod,
        ],
        log: true,
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    });
};
export default func;

func.tags = ['RewardPool'];
