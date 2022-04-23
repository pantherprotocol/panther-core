// SPDX-License-Identifier: MIT
// @ts-ignore
import { ethers } from 'hardhat';
import { BytesLike } from '@ethersproject/bytes/src.ts';

type Tuple<T, N extends number, A extends any[] = []> = A extends {
    length: N;
}
    ? A
    : Tuple<T, N, [...A, T]>;

type Tuple3<T> = Tuple<T, 3>;

export type Triad = Tuple3<BytesLike>;

// (also defined in ../contracts/TriadMerkleZeros.sol)
export const zeroLeaf =
    '0x0667764c376602b72ef22218e1673c2cc8546201f9a77807570b3e5de137680d';

// (also defined in ../contracts/TriadMerkleZeros.sol)
export const zeroTriadTreeRoot =
    '0x20fc043586a9fcb416cdf2a3bc8a995f8f815d43f1046a20d1c588cf20482a55';

export const zeroLeavesTriad = [zeroLeaf, zeroLeaf, zeroLeaf] as Triad;

function toBigNum(n: number | string) {
    return ethers.BigNumber.from(n);
}

function toBytes32(n: number | string) {
    return (
        '0x' +
        ethers.utils
            .hexlify(ethers.BigNumber.from(n))
            .replace('0x', '')
            .padStart(64, '0')
    );
}

export { toBigNum, toBytes32 };
