import {ethers} from 'hardhat';

export async function getBlockNumber() {
    return (await ethers.provider.getBlock('latest')).number;
}

export async function getBlockTimestamp() {
    return (await ethers.provider.getBlock('latest')).timestamp;
}
