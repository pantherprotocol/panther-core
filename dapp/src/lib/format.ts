import {BigNumber, utils} from 'ethers';
import moment from 'moment';

import {getLocale} from './i18n';
import {roundDown} from './numbers';

export function formatTime(
    date: number | null,
    options?: {style?: 'long' | 'full' | 'medium' | 'short'},
): string | null {
    if (!date) return null;
    const localDate = new Date(date);
    const style = options?.style ?? 'long';
    return (
        localDate.toLocaleDateString(getLocale(), {
            dateStyle: style,
        }) +
        ' ' +
        localDate.toLocaleTimeString(getLocale(), {
            timeStyle: style,
        })
    );
}

export function formatLongTime(date: number | null): string | null {
    return formatTime(date, {style: 'long'});
}

export function formatTimeSince(date: number | null): string {
    return moment(date).fromNow();
}

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
