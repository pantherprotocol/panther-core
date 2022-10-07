/*
Some of the functions are modified version or inspired by this code:
https://github.com/appliedzkp/maci/blob/master/crypto/ts/index.ts
*/

import assert from 'assert';
import crypto from 'crypto';

// @ts-ignore
import {babyjub, poseidon} from 'circomlibjs';
import {IKeypair, PrivateKey, PublicKey} from './types/keypair';

// ALT_BN128 (also known as BN254) order and BabyJubJub field prime
export const SNARK_FIELD_SIZE = BigInt(
    '21888242871839275222246405745257275088548364400416034343698204186575808495617',
);
assert(babyjub.p === SNARK_FIELD_SIZE);

export const deriveKeypairFromPrivateKey = (privateKey: BigInt): IKeypair => {
    assert(privateKey < babyjub.subOrder);
    const publicKey = derivePublicKeyFromPrivate(privateKey);
    return {privateKey, publicKey};
};

export const deriveKeypairFromSeed = (seed: BigInt): IKeypair => {
    assert(seed != BigInt(0));
    const privateKey = moduloBabyJubSubFieldPrime(seed);
    return deriveKeypairFromPrivateKey(privateKey);
};

export const deriveKeypairFromSignature = (signature: string): IKeypair => {
    const pKey = derivePrivateKeyFromSignature(signature);
    return deriveKeypairFromPrivateKey(pKey);
};

export const derivePublicKeyFromPrivate = (
    privateKey: PrivateKey,
): PublicKey => {
    assert(privateKey < babyjub.subOrder);
    return babyjub.mulPointEscalar(babyjub.Base8, privateKey);
};

export const deriveChildPubKeyFromRootPubKey = (
    rootPubKey: PublicKey,
    random: BigInt,
): PublicKey => {
    // MUST (not asserted here): rootPubKey to be generated from the babyjub.Base8
    assert(random < babyjub.subOrder);
    return babyjub.mulPointEscalar(rootPubKey, random);
};

export const derivePrivateKeyFromSignature = (signature: string): BigInt => {
    const pair = extractSecretsPair(signature);
    if (!pair) {
        throwKeychainError('Failed to extract secrets pair from signature');
    }
    return moduloBabyJubSubFieldPrime(poseidon(pair));
};

export const deriveChildPrivKeyFromRootPrivKey = (
    rootPrivKey: PrivateKey,
    random: BigInt,
): PrivateKey => {
    assert(rootPrivKey < babyjub.subOrder);
    assert(random < babyjub.subOrder);
    const product = (rootPrivKey as bigint) * (random as bigint);
    return moduloBabyJubSubFieldPrime(product);
};

export const generateRandomKeypair = () =>
    deriveKeypairFromPrivateKey(generateRandomInBabyJubSubField());

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

export const generateRandomInBabyJubSubField = (): BigInt => {
    return moduloBabyJubSubFieldPrime(generateRandom256Bits());
};

export const moduloSnarkFieldPrime = (v: BigInt | bigint): BigInt => {
    return (v as bigint) % SNARK_FIELD_SIZE;
};

export const moduloBabyJubSubFieldPrime = (value: BigInt | bigint) => {
    return (value as bigint) % babyjub.subOrder;
};

export const extractSecretsPair = (
    signature: string,
): [r: BigInt, s: BigInt] => {
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
        moduloSnarkFieldPrime(BigInt('0x' + r)),
        moduloSnarkFieldPrime(BigInt('0x' + s)),
    ];
};

const throwKeychainError = (errMsg: string) => {
    throw new Error(`Keychain error: ${errMsg}`);
};
