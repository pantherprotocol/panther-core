import {BigNumber, utils} from 'ethers';

export const toBN = (n: number): BigNumber => BigNumber.from(n);
export const DECIMALS = 18; //18 decimal places after floating point
export const E18 = toBN(10).pow(toBN(DECIMALS));
export const CONFIRMATIONS_NUM = 1;

export const formatTime = (date: number | null): string | null => {
    if (!date) return null;
    const localDate = new Date(date);
    localDate.setMinutes(
        localDate.getMinutes() - localDate.getTimezoneOffset(),
    );
    return localDate.toLocaleString();
};

export function getDefaultLocale(): string {
    return (
        navigator.language || new Intl.NumberFormat().resolvedOptions().locale
    );
}

export function formatPercentage(percentage: number): string {
    const percentFormat = new Intl.NumberFormat(getDefaultLocale(), {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        // maximumSignificantDigits: 4,
        style: 'percent',
    });
    return percentFormat.format(percentage);
}

export function fiatPrice(
    amount: BigNumber | null,
    price: BigNumber | null,
): BigNumber | null {
    return amount && price && amount.mul(price).div(E18);
}

function getDecimalSeparator(): string {
    const n = 1.1;
    return n.toLocaleString().substring(1, 2);
}

export function roundDown(s: string, decimals: number): string {
    const regexp = new RegExp(`(${getDecimalSeparator()}\\d{${decimals}}).+$`);
    return s.replace(regexp, '$1');
}

export function formatCurrency(value: BigNumber | null) {
    if (!value) {
        return '';
    }
    const num = Number(utils.formatEther(value));

    const currencyFormat = new Intl.NumberFormat(getDefaultLocale(), {
        // minimumSignificantDigits: 10,
        minimumFractionDigits: 10,
        // maximumFractionDigits: 5,

        // TypeScript doesn't allow these :-(
        // roundingMode: 'floor',
        // trailingZeroDisplay: 'lessPrecision',
    });
    const formatted = currencyFormat.format(num);
    return roundDown(formatted, 3);
    // return ethers.utils
    //     .commify()
    //     .replace(/\.0$/, '');
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
