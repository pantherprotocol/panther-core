import assert from 'assert';
import crypto from 'crypto';

import createBlakeHash from 'blake-hash';
import {babyjub, eddsa} from 'circomlibjs';
import * as ff from 'ffjavascript';

import {IKeypair, PrivateKey, PublicKey} from './types';

export const FIELD_SIZE = BigInt(
    '21888242871839275222246405745257275088548364400416034343698204186575808495617',
);

export const deriveKeypairFromSeed = (
    seed = generateRandomBabyJubValue(),
): IKeypair => {
    const privateKey = generatePrivateKeyBabyJubJubFromSeed(seed); //
    const publicKey = generatePublicKey(privateKey);
    return {
        privateKey: privateKey,
        publicKey: publicKey,
    };
};

export const generateRandomKeypair = (): IKeypair => {
    const seed = generateRandomBabyJubValue();
    return deriveKeypairFromSeed(seed);
};

export const generatePrivateKeyBabyJubJubFromSeed = (
    seed: bigint,
): PrivateKey => {
    const privateKey: PrivateKey = seed % FIELD_SIZE;
    assert(privateKey < FIELD_SIZE);
    return privateKey;
};

export const generatePublicKey = (privateKey: PrivateKey): PublicKey => {
    privateKey = BigInt(privateKey.toString());
    assert(privateKey < FIELD_SIZE);
    return babyjub.mulPointEscalar(
        babyjub.Base8,
        formatPrivateKeyForBabyJub(privateKey),
    );
};

export const formatPrivateKeyForBabyJub = (privateKey: PrivateKey) => {
    const sBuff = eddsa.pruneBuffer(
        createBlakeHash('blake512')
            .update(bigIntToBuffer(privateKey))
            .digest()
            .slice(0, 32),
    );
    const s = ff.utils.leBuff2int(sBuff);
    return ff.Scalar.shr(s, 3);
};

const generateRandomness = (): bigint => {
    const min = BigInt(
        '6350874878119819312338956282401532410528162663560392320966563075034087161851',
    );
    let randomness;
    while (true) {
        randomness = BigInt('0x' + crypto.randomBytes(32).toString('hex'));
        if (randomness >= min) {
            break;
        }
    }
    return randomness;
};

const bigIntToBuffer = (i: BigInt): Buffer => {
    let hexStr = i.toString(16);
    while (hexStr.length < 64) {
        hexStr = '0' + hexStr;
    }
    return Buffer.from(hexStr, 'hex');
};

const generateRandomBabyJubValue = (): bigint => {
    const random = generateRandomness();
    const privateKey: PrivateKey = random % FIELD_SIZE;
    assert(privateKey < FIELD_SIZE);
    return privateKey;
};

// const hashPoseidon = (seed: string): string => {
//     const hash = '';
//     // TODO: any string converted to 32 byte hash -> SHA256 or Poseidon
//     return hash;
// };
