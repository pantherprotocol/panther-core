export const bigIntToBuffer = (bigint: bigint, width = 32) => {
    const hex = bigint.toString(16);
    return Buffer.from(hex.padStart(width * 2, '0').slice(0, width * 2), 'hex');
};

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
