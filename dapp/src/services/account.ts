import {formatEther} from '@ethersproject/units';
import {BigNumberish} from 'ethers';

export const formatAccountAddress = (
    account: string | undefined | null,
): string | null => {
    if (!account) return null;
    const start = account.substring(0, 6);
    const end = account.substring(account.length - 4);
    return `${start}...${end}`;
};

export const formatAccountBalance = (
    balance: BigNumberish | null,
    currency: string,
): string | null => {
    if (!balance) return null;
    const amount = formatEther(balance).substring(0, 6);
    return `${amount} ${currency}`;
};