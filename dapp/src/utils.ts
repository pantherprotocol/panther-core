import * as ethers from 'ethers';

export const formatTime = (date: number | null): string | null => {
    if (!date) return null;
    const localDate = new Date(date);
    localDate.setMinutes(
        localDate.getMinutes() - localDate.getTimezoneOffset(),
    );
    return localDate.toLocaleString();
};

export const formatCurrency = (value: number | string) => {
    if (!value) return value;
    const valueAsNumber = +value;
    return valueAsNumber.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
};

export const toBN = (n: number): ethers.BigNumber => ethers.BigNumber.from(n);
export const e18 = toBN(10).pow(toBN(18)); //18 decimal places after floating point
export const CONFIRMATIONS_NUM = 1;
