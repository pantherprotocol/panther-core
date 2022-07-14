import {utils, BigNumber, constants} from 'ethers';
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

export const sumBigNumbers = (arr: any[], initialValue = constants.Zero) => {
    const sum = arr?.reduce(
        (total, item) => total.add(BigNumber.from(item)),
        initialValue,
    );

    return sum;
};
