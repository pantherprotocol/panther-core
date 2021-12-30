import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const pool = await hre.ethers.getContract("RewardPool");

    await deploy("RewardMaster", {
        from: deployer,
        args: [process.env.STAKING_TOKEN, pool.address, deployer],
        log: true,
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    });
};
export default func;

func.tags = ["RewardMaster"];
