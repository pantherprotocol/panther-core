import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/dist/src/signers';
import {ethers, network} from 'hardhat';

const provider = ethers.provider;

// If a test suite alter chain time (with `mineBlock` or `increaseTime`)
// consider taking a chain snapshot (with `takeSnapshot`) before tests and
// reverting to the snapshot taken (with revertSnapshot) after tests

export const mineBlock = async (timestamp?: number) => {
    await provider.send('evm_mine', timestamp ? [timestamp] : []);
    return provider.getBlock('latest');
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

export const impersonate = async (addr: string): Promise<SignerWithAddress> => {
    await network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [addr],
    });
    return await ethers.getSigner(addr);
};

export const unimpersonate = async (addr: string): Promise<void> => {
    await network.provider.request({
        method: 'hardhat_stopImpersonatingAccount',
        params: [addr],
    });
};

export const ensureMinBalance = async (
    account: string,
    minBalanceStr: string,
): Promise<void> => {
    const balance = await provider.getBalance(account);
    const minBalanceBN = ethers.BigNumber.from(minBalanceStr);
    if (minBalanceBN.gt(balance)) {
        await provider.send('hardhat_setBalance', [account, minBalanceStr]);
    }
};
