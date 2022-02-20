import {BigNumber, ethers} from 'ethers';

export const formatAccountAddress = (
    account: string | undefined | null,
): string | null => {
    if (!account) return null;
    const start = account.substring(0, 6);
    const end = account.substring(account.length - 4);
    return `${start}...${end}`;
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
