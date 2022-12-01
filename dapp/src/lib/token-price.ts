// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {E18} from 'constants/numbers';

import {BigNumber} from 'ethers';

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
