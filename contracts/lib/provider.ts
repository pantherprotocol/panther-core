// For some reason this import is required in order to ensure
// hre.ethers.provider is available when running:
//
//   yarn ts-node ./testing/polygon-fix/staking-simulation.ts
//
// even though https://hardhat.org/guides/scripts.html suggests it shouldn't
// be necessary:
import '@nomiclabs/hardhat-ethers';
import {ethers} from 'hardhat';

export async function getBlockNumber() {
    return (await ethers.provider.getBlock('latest')).number;
}

export async function getBlockTimestamp(block?: number | 'latest') {
    return (await ethers.provider.getBlock(block || 'latest')).timestamp;
}
