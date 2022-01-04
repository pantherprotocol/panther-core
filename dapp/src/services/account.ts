import {formatEther} from '@ethersproject/units';
import {BigNumberish, ethers, utils} from 'ethers';

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

export const formatTokenBalance = (
    balance: BigNumberish | null,
    decimal: BigNumberish,
): string | null => {
    if (!balance) return null;
    const formattedBalance = utils.formatUnits(balance, decimal);
    return (+formattedBalance).toFixed(2);
};

export async function getTokenBalance(
    contract: ethers.Contract,
    address: string | null | undefined,
): Promise<string | null> {
    if (!contract) {
        return null;
    }
    const balance: number = await contract.balanceOf(address);
    const decimal = await contract.decimals();
    return formatTokenBalance(balance, decimal);
}
