import {formatEther} from '@ethersproject/units';
import {BigNumber, ethers, utils} from 'ethers';

import {DECIMALS} from '../utils';

export const formatAccountAddress = (
    account: string | undefined | null,
): string | null => {
    if (!account) return null;
    const start = account.substring(0, 6);
    const end = account.substring(account.length - 4);
    return `${start}...${end}`;
};

export const formatAccountBalance = (
    balance: BigNumber | null,
    currency: string,
    decimals = 2,
): string | null => {
    if (!balance) return null;
    const amount = formatEther(balance);
    return `${(+amount).toFixed(decimals)} ${currency}`;
};

export const formatTokenBalance = (
    balance: BigNumber | null,
    decimals = 2,
): string | null => {
    if (!balance) return null;
    const formattedBalance = utils.formatUnits(balance, DECIMALS);
    return (+formattedBalance).toFixed(decimals);
};

export const formatUSDPrice = (balance: string | null): string | null => {
    if (!balance) return null;
    return (+balance).toFixed(2);
};

export async function getTokenBalance(
    contract: ethers.Contract,
    address: string | null | undefined,
): Promise<BigNumber | null> {
    if (!contract) {
        console.error('getTokenBalance called with null contract');
        return null;
    }
    if (!address) {
        console.error('getTokenBalance called with null address');
        return null;
    }
    return await contract.balanceOf(address);
}
