/*
Some of the functions are modified version or inspired by this code:
https://github.com/appliedzkp/maci/blob/master/crypto/ts/index.ts
*/

import assert from 'assert';
import crypto from 'crypto';

import createBlakeHash from 'blake-hash';
import { babyjub, eddsa, poseidon } from 'circomlibjs';
import * as ff from 'ffjavascript';
import { IKeypair, PrivateKey, PublicKey } from './types/keypair';

export const SNARK_FIELD_SIZE = BigInt(
    '21888242871839275222246405745257275088548364400416034343698204186575808495617',
);

export const deriveKeypairFromSeed = (
    seed = generateRandomBabyJubValue(),
): IKeypair => {
    const privateKey = truncateToSnarkField(seed); //
    const publicKey = generatePublicKey(privateKey);
    return {
        privateKey: privateKey,
        publicKey: publicKey,
    };
};

export const multiplyScalars = (a: BigInt, b: BigInt): BigInt => {
    return ( (a as bigint) * (b as bigint)) % babyjub.subOrder;
};

export const deriveKeypairFromSignature = (signature: string): IKeypair => {
    const pKey = derivePrivateKeyFromSignature(signature);
    return deriveKeypairFromSeed(pKey);
};

export const truncateToSnarkField = (v: BigInt): BigInt => {
    return (v as bigint) % SNARK_FIELD_SIZE;
};

export const generatePublicKey = (privateKey: PrivateKey): PublicKey => {
    assert(privateKey < SNARK_FIELD_SIZE);
    return babyjub.mulPointEscalar(
        babyjub.Base8,
        formatPrivateKeyForBabyJub(privateKey),
    );
};

export const formatPrivateKeyForBabyJub = (privateKey: PrivateKey) => {
    return (privateKey as bigint) % babyjub.subOrder;
    /* THIS CODE IS NOT IN USE - Steve & Roman
    const sBuff = eddsa.pruneBuffer(
        createBlakeHash('blake512')
            .update(bigIntToBuffer(privateKey))
            .digest()
            .slice(0, 32),
    );
    const s = ff.utils.leBuff2int(sBuff);
    return ff.Scalar.shr(s, 3);
    */
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

export const generateRandomBabyJubValue = (): BigInt => {
    const random = generateRandomness();
    const privateKey: PrivateKey = random % SNARK_FIELD_SIZE;
    assert(privateKey < SNARK_FIELD_SIZE);
    return privateKey;
};

export const extractSecretsPair = (
    signature: string,
): [r: bigint, s: bigint] => {
    if (!signature) {
        throwKeychainError('Signature must be provided');
    }
    if (signature.length !== 132) {
        throwKeychainError(
            `Tried to create keypair from signature of length '${signature.length}'`,
        );
    }
    if (signature.slice(0, 2) !== '0x') {
        throwKeychainError(
            `Tried to create keypair from signature without 0x prefix`,
        );
    }
    // We will never verify this signature; we're only using it as a
    // deterministic source of entropy which can be used in a ZK proof.
    // So we can discard the LSB v which has the least entropy.
    const r = signature.slice(2, 66);
    const s = signature.slice(66, 130);
    return [
        BigInt('0x' + r) % SNARK_FIELD_SIZE,
        BigInt('0x' + s) % SNARK_FIELD_SIZE,
    ];
};

export const derivePrivateKeyFromSignature = (signature: string): BigInt => {
    const pair = extractSecretsPair(signature);
    if (!pair) {
        throwKeychainError('Failed to extract secrets pair from signature');
    }
    return poseidon(pair);
};

const throwKeychainError = (errMsg: string) => {
    throw new Error(`Keychain error: ${errMsg}`);
};
