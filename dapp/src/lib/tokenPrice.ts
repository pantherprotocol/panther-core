import {BigNumber} from 'ethers';

import {E18} from './constants';
import {formatUSD} from './format';

export function fiatPrice(
    amount: BigNumber | null,
    price: BigNumber | null,
): BigNumber | null {
    return amount && price && amount.mul(price).div(E18);
}

export function calcUSDPrice(
    value: BigNumber | null,
    price: BigNumber | null,
    options?: {decimals?: number},
): string {
    const usdValue = fiatPrice(value, price);
    return formatUSD(usdValue, options);
}
