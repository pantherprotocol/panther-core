import {BigNumber, utils} from 'ethers';

import {getLocale} from './i18n';
import {roundDown} from './numbers';

export const formatTime = (date: number | null): string | null => {
    if (!date) return null;
    const localDate = new Date(date);
    return (
        localDate.toLocaleDateString(getLocale(), {
            dateStyle: 'long',
        }) +
        ' ' +
        localDate.toLocaleTimeString(getLocale(), {
            timeStyle: 'long',
        })
    );
};

export function formatPercentage(percentage: number): string {
    const percentFormat = new Intl.NumberFormat(getLocale(), {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        // maximumSignificantDigits: 4,
        style: 'percent',
    });
    return percentFormat.format(percentage);
}

export function formatCurrency(
    value: BigNumber | null,
    options?: {decimals?: number},
) {
    if (!value) {
        return '';
    }
    const num = Number(utils.formatEther(value));

    const currencyFormat = new Intl.NumberFormat(getLocale(), {
        // minimumSignificantDigits: 10,
        minimumFractionDigits: 10,
        // maximumFractionDigits: 5,

        // TypeScript doesn't allow these :-(
        // roundingMode: 'floor',
        // trailingZeroDisplay: 'lessPrecision',
    });
    const formatted = currencyFormat.format(num);
    return roundDown(formatted, options?.decimals ?? 2);
    // return ethers.utils
    //     .commify()
    //     .replace(/\.0$/, '');
}

export function formatUSD(
    value: BigNumber | null,
    options?: {decimals?: number},
): string {
    return `$${formatCurrency(value, options)} USD`;
}
