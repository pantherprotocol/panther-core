import {formatDistance, formatDistanceToNowStrict} from 'date-fns';
import {BigNumber, utils} from 'ethers';

import {getLocale} from './i18n';
import {roundDown} from './numbers';

const ADDRESS_SUBSTRING_LENGTH = 4;

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

export function formatTimeSince(date: number): string {
    return formatDistance(date, new Date(), {addSuffix: true});
}

export function secondsToFullDays(sec: number): number {
    return Math.floor(sec / 60 / 60 / 24);
}

export function formatPercentage(
    percentage: number,
    options?: {decimals?: number; scale?: number},
): string {
    const percentFormat = new Intl.NumberFormat(getLocale(), {
        minimumFractionDigits: options?.decimals ?? 2,
        maximumFractionDigits: options?.decimals ?? 2,
        // maximumSignificantDigits: 4,
        style: 'percent',
    });
    return percentFormat.format(percentage);
}

export function formatCurrency(
    value: BigNumber | null,
    options?: {decimals?: number; scale?: number},
) {
    if (!value) {
        return '';
    }
    const num = Number(utils.formatUnits(value, options?.scale ?? 18));

    const currencyFormat = new Intl.NumberFormat(getLocale(), {
        // minimumSignificantDigits: 10,
        minimumFractionDigits: 3,

        /**
          we have to set the maximumFractionDigits,
          otherwise the format function willn't consider the
          the  minimumFractionDigits, and will use it as maximumFractionDigits

        */
        maximumFractionDigits: 18,

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

export function splitFloatNumber(value: string): [string, string] | [] {
    const regex = /^\d*\.?\d*$/; // matches floating points numbers
    if (!regex.test(value)) {
        return [];
    }

    const [whole, fractional] = value.split('.');

    return [whole || '0', fractional || '0'];
}

export function getFormattedFractions(amount: string): (string | undefined)[] {
    let [whole, fractional] = splitFloatNumber(amount);
    fractional = fractional?.padEnd(2, '0').substring(0, 2);
    whole = whole
        ? formatCurrency(BigNumber.from(whole), {
              decimals: 0,
              scale: 0,
          })
        : undefined;
    return [whole, fractional];
}

export function formatAccountAddress(
    account: string | undefined | null,
): string | null {
    if (!account) return null;
    const start = account.substring(2, ADDRESS_SUBSTRING_LENGTH);
    const end = account.substring(account.length - ADDRESS_SUBSTRING_LENGTH);
    return `0x${start}...${end}`;
}

export function formatRemainingPeriod(end: Date): string {
    const now = new Date();
    const periodInMs = end.getTime() - now.getTime();
    if (periodInMs < 0) return '-';

    const oneDayMs = 60 * 60 * 24 * 1000;

    return formatDistanceToNowStrict(end, {
        unit: periodInMs > oneDayMs ? 'day' : 'hour',
        roundingMethod: 'ceil',
    });
}
