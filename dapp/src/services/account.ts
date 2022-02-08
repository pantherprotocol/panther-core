import {formatEther} from '@ethersproject/units';
import {BigNumber, ethers, utils} from 'ethers';

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
): string | null => {
    if (!balance) return null;
    const amount = formatEther(balance);
    return `${(+amount).toFixed(4)} ${currency}`;
};

export const formatTokenBalance = (
    balance: BigNumber | null,
    decimal: BigNumber,
): string | null => {
    if (!balance) return null;
    const formattedBalance = utils.formatUnits(balance, decimal);
    return (+formattedBalance).toFixed(2);
};

export const formatUSDPrice = (balance: string | null): string | null => {
    if (!balance) return null;
    return (+balance).toFixed(2);
};

export async function getTokenBalance(
    contract: ethers.Contract,
    address: string | null | undefined,
): Promise<string | null> {
    if (!contract) {
        console.error('getTokenBalance called with null contract');
        return null;
    }
    if (!address) {
        console.error('getTokenBalance called with null address');
        return null;
    }
    const balance: BigNumber = await contract.balanceOf(address);
    const decimal = await contract.decimals();
    return formatTokenBalance(balance, decimal);
}
