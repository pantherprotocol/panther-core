import {BigNumber, utils} from 'ethers';

export const fe = utils.formatEther;
export const pe = utils.parseEther;

export const BN = BigNumber;
export const toBN = BN.from;

export function toDate(timestamp: number) {
    return new Date(timestamp * 1000);
}

export function parseDate(date: string): number {
    return Math.floor(new Date(date).getTime() / 1000);
}

export const td = toDate;
export const pd = parseDate;
