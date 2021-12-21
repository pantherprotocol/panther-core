import { Contract, ContractFactory } from "ethers";
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function deploy() {
    // Deploy zStaking
    const Staking: ContractFactory = await ethers.getContractFactory("Staking");
    const contract: Contract = await Staking.deploy(
        process.env.STAKING_TOKEN,
        process.env.STAKING_OWNER
    );
    console.log("Staking was deployed to: ", contract.address);
}

async function main(): Promise<void> {
    await deploy();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error: Error) => {
        console.error(error);
        process.exit(1);
    });
