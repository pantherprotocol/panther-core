import {BigNumber} from 'ethers';
import {getTokenContract} from 'services/contracts';

export async function getTokenBalance(
    library: any,
    chainId: number,
    account: string,
): Promise<BigNumber | null> {
    const contract = getTokenContract(library, chainId);
    return await contract.balanceOf(account);
}
