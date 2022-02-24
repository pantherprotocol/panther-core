import {BigNumber} from 'ethers';

import {getTokenContract} from './contracts';

export const formatAccountAddress = (
    account: string | undefined | null,
): string | null => {
    if (!account) return null;
    const start = account.substring(0, 6);
    const end = account.substring(account.length - 4);
    return `${start}...${end}`;
};

export async function getTokenBalance(
    library: any,
    chainId: number,
    account: string,
): Promise<BigNumber | null> {
    const contract = getTokenContract(library, chainId);
    return await contract.balanceOf(account);
}
