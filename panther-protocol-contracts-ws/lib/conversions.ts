import type { BytesLike } from '@ethersproject/bytes';
import { utils } from 'ethers';

export function toBytes32(data: BytesLike): string {
    return utils.hexZeroPad(data, 32);
}

export function bigintToBytes32(data: bigint): string {
    return utils.hexZeroPad(utils.hexlify(data), 32);
}
