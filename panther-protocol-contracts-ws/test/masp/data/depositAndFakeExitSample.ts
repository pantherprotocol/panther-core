import { BytesLike } from '@ethersproject/bytes/src.ts';
import { ethers } from 'hardhat';
import { BigNumberish } from '@ethersproject/bignumber/src.ts';
import { toBytes32 } from '../../../lib/utilities';

import { getTriadAt } from './triadTreeSample';
import { randomInt } from 'crypto';

const randomNumber = '999';
const randomAddress = ethers.Wallet.createRandom().address;
const randomG1Point = {
    x: toBytes32(randomNumber),
    y: toBytes32(randomNumber),
};

type G1Point = {
    x: string;
    y: string;
};

type DepositSample = {
    tokens: [string, string, string];
    tokenIds: [BigNumberish, BigNumberish, BigNumberish];
    amounts: [BigNumberish, BigNumberish, BigNumberish];
    pubSpendingKeys: [G1Point, G1Point, G1Point];
    secrets: [
        [BytesLike, BytesLike, BytesLike],
        [BytesLike, BytesLike, BytesLike],
        [BytesLike, BytesLike, BytesLike],
    ];
    createdAtNum: BigNumberish;
};

export const depositSample: DepositSample = {
    tokens: [randomAddress, randomAddress, randomAddress],
    tokenIds: [randomInt(0, 1e10), randomInt(0, 1e10), randomInt(0, 1e10)],
    amounts: [randomNumber, randomNumber, randomNumber],
    pubSpendingKeys: [randomG1Point, randomG1Point, randomG1Point],
    secrets: [getTriadAt(0), getTriadAt(1), getTriadAt(2)],
    createdAtNum: randomNumber,
};

type Exit = {
    token: string;
    subId: BigNumberish;
    scaledAmount: BigNumberish;
    creationTime: BigNumberish;
    privSpendingKey: BigNumberish;
    leafId: BigNumberish;
    pathElements: [
        BytesLike,
        BytesLike,
        BytesLike,
        BytesLike,
        BytesLike,
        BytesLike,
        BytesLike,
        BytesLike,
        BytesLike,
        BytesLike,
        BytesLike,
        BytesLike,
        BytesLike,
        BytesLike,
        BytesLike,
        BytesLike,
    ];
    merkleRoot: BytesLike;
    cacheIndexHint: BigNumberish;
};

export const fakeExitCommitment =
    '0x000102030405060708090A0B0C0D0E0F000102030405060708090A0B0C0D0E0F';
export const anotherFakeExitCommitment =
    '0x101112131415161718191A1B1C1D1E1F110112131415161718191A1B1C1D1E1F';

export const getExitCommitment = (pk: BigNumberish, recipient: string) =>
    ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
            ['uint256', 'address'],
            [pk, recipient],
        ),
    );

export const exitSample = {
    token: randomAddress,
    subId: '0',
    scaledAmount: randomNumber,
    creationTime: randomNumber,
    privSpendingKey: toBytes32(randomNumber),
    leafId: '0',
    pathElements: Array.from(Array(16).keys()).map(() =>
        toBytes32(randomNumber),
    ),
    merkleRoot: toBytes32(randomNumber),
    cacheIndexHint: '0',
} as Exit;
