import {ethers} from 'hardhat';

const provider = ethers.provider;

// If a test suite alter chain time (with `mineBlock` or `increaseTime`)
// consider taking a chain snapshot (with `takeSnapshot`) before tests and
// reverting to the snapshot taken (with revertSnapshot) after tests

export const mineBlock = async (timestamp?: number) => {
    await provider.send('evm_mine', [timestamp]);
};

export const increaseTime = async (seconds: number) => {
    await provider.send('evm_increaseTime', [seconds]);
};

export const takeSnapshot = async (): Promise<number> => {
    return await provider.send('evm_snapshot', []);
};

export const revertSnapshot = async (id: number) => {
    await provider.send('evm_revert', [id]);
};
