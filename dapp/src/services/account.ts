// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

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
