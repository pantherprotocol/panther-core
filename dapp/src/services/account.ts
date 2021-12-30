import {formatEther} from '@ethersproject/units';
import {BigNumberish, ethers} from 'ethers';

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
): number | null => {
    if (!balance) return null;
    return ethers.BigNumber.from(balance).toNumber();
};

export async function getTokenBalance(
    contract: ethers.Contract,
    address: string | null | undefined,
): Promise<number | null> {
    if (!contract) {
        return null;
    }
    const balance: number = await contract.balanceOf(
        address,
    );
    return formatTokenBalance(balance);
}
