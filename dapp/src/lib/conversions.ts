import type {BytesLike} from '@ethersproject/bytes';
import {utils} from 'ethers';

export function toBytes32(data: BytesLike): string {
    return utils.hexZeroPad(data, 32);
}

export function bigintToBytes32(data: bigint): string {
    return bigintToBytes(data, 32);
}

export function bigintToBytes(data: bigint, width: number): string {
    return utils.hexZeroPad('0x' + data.toString(16), width);
}
