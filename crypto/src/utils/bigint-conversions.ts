import type {BytesLike} from '@ethersproject/bytes';
import {utils} from 'ethers';

export function bigIntToBuffer(bn: bigint, width = 32) {
    const hex = bn.toString(16);
    return Buffer.from(hex.padStart(width * 2, '0').slice(0, width * 2), 'hex');
}

export const bufferToBigInt = (buf: Buffer) => {
    const hex = buf.toString('hex');
    if (hex.length === 0) {
        return BigInt(0);
    }
    return BigInt(`0x${hex}`);
};

export function bigIntToUint8Array(bigint: bigint, width = 32): Uint8Array {
    return new Uint8Array(bigIntToBuffer(bigint, width));
}

export function uint8ArrayToBigInt(uint8Array: Uint8Array): bigint {
    return bufferToBigInt(Buffer.from(uint8Array));
}

export function bytesToHexString32(data: BytesLike): string {
    return bytesToHexString(data, 32);
}

export function bytesToHexString(data: BytesLike, width = 32): string {
    return utils.hexZeroPad(data, width);
}

export function bigintToBytes32(data: bigint): string {
    return bigintToBytes(data, 32);
}

export function bigintToBytes(data: bigint, width: number): string {
    return utils.hexZeroPad('0x' + data.toString(16), width);
}
