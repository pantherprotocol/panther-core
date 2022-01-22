import {ethers} from 'hardhat';

const provider = ethers.provider;

export const mineBlock = async (timestamp?: number) => {
    await provider.send('evm_mine', [timestamp]);
};

export const increaseTime = async (seconds: number) => {
    await provider.send('evm_increaseTime', [seconds]);
};
