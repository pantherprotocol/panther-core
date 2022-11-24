// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {utils, BigNumber} from 'ethers';
import {escapeRegExp} from 'lodash';

import {getDecimalSeparator} from './i18n';

export function roundDown(s: string, decimals: number): string {
    const sep = escapeRegExp(getDecimalSeparator());
    if (decimals === 0) {
        const regexp = new RegExp(`${sep}\\d+$`);
        return s.replace(regexp, '');
    }
    const regexp = new RegExp(`(${sep}\\d{${decimals}}).+$`);
    const rounded = s.replace(regexp, '$1');
    return rounded;
}

export function formatEther(bignum: BigNumber | null): string | null {
    return bignum && utils.formatEther(bignum);
}

export function safeParseUnits(s: string | null): BigNumber | null {
    try {
        return utils.parseUnits(s || '');
    } catch (err: any) {
        return null;
    }
}

export function bnStrToNumber(bnStr: string) {
    return BigNumber.from(bnStr).toNumber();
}

export function safeParseStringToBN(
    value: string | null | undefined,
): BigNumber | null {
    return value ? BigNumber.from(value) : null;
}
