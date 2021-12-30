import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log(`VESTING_POOLS=${process.env.VESTING_POOLS}`);

    await deploy("RewardPool", {
        from: deployer,
        args: [process.env.VESTING_POOLS, deployer],
        log: true,
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    });
};
export default func;

func.tags = ["RewardPool"];
