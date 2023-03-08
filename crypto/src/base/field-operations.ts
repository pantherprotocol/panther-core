// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
// The code is inspired by applied ZKP
import crypto from 'crypto';

// @ts-ignore
import {babyjub} from 'circomlibjs';

import {assert, assertInBabyJubJubSubOrder} from '../utils/assertions';
import {SNARK_FIELD_SIZE} from '../utils/constants';

assert(babyjub.p === SNARK_FIELD_SIZE, 'SNARK field size mismatch');

export const generateRandom256Bits = (): bigint => {
    const min = BigInt(
        '6350874878119819312338956282401532410528162663560392320966563075034087161851',
    );
    let randomness;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        randomness = BigInt('0x' + crypto.randomBytes(32).toString('hex'));
        if (randomness >= min) break;
    }
    return randomness;
};

export const generateRandomInBabyJubSubField = (): bigint => {
    const random = moduloBabyJubSubFieldPrime(generateRandom256Bits());
    assertInBabyJubJubSubOrder(random, 'random');
    return random;
};

export const moduloSnarkFieldPrime = (v: bigint): bigint => {
    return v % SNARK_FIELD_SIZE;
};

export const moduloBabyJubSubFieldPrime = (value: bigint) => {
    return value % babyjub.subOrder;
};
