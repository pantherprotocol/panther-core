/*
Some of the functions are modified version or inspired by this code:
https://github.com/appliedzkp/maci/blob/master/crypto/ts/index.ts
*/

import crypto from 'crypto';

import {babyjub, poseidon} from 'circomlibjs';

import {
    assertInSnarkField,
    assertInBabyJubJubSubOrder,
    assert,
} from './assertions';
import {IKeypair, PrivateKey, PublicKey} from './types';

export const SNARK_FIELD_SIZE = BigInt(
    '21888242871839275222246405745257275088548364400416034343698204186575808495617',
);

export const isChildPubKeyValid = (
    childPubKey: PublicKey,
    rootKeypair: IKeypair,
    randomSecret: bigint,
): boolean => {
    console.time('isChildPubKeyValid()');
    assertInSnarkField(childPubKey[0], 'Child public key X');
    assertInSnarkField(childPubKey[1], 'Child public key Y');
    assertInSnarkField(rootKeypair.publicKey[0], 'Root public key X');
    assertInSnarkField(rootKeypair.publicKey[1], 'Root public key Y');
    const rs = multiplyScalars(rootKeypair.privateKey, randomSecret);
    const rs_B = derivePublicKeyFromPrivate(rs);
    const s_rB = generateChildPublicKey(rootKeypair.publicKey, randomSecret);
    const isValid =
        childPubKey[0] === rs_B[0] &&
        childPubKey[1] === rs_B[1] &&
        s_rB[0] === childPubKey[0] &&
        s_rB[1] === childPubKey[1];

    console.debug(`generated public key is${isValid ? '' : ' NOT'} valid`);
    console.timeEnd('isChildPubKeyValid()');
    return isValid;
};

export const deriveKeypairFromPrivateKey = (privateKey: BigInt): IKeypair => {
    const pkey = privateKey as bigint;
    assertInBabyJubJubSubOrder(pkey, 'privateKey');
    const publicKey = derivePublicKeyFromPrivate(pkey);
    return {
        privateKey: pkey,
        publicKey: publicKey,
    };
};

export const deriveKeypairFromSeed = (seed: BigInt): IKeypair => {
    assert(seed != BigInt(0), 'Zero seed is not allowed');
    const privateKey = moduloBabyJubSubFiledPrime(seed);
    return deriveKeypairFromPrivateKey(privateKey);
};

export const generateRandomKeypair = () =>
    deriveKeypairFromPrivateKey(generateRandomInBabyJubSubField());

export const generateChildPublicKey = (
    rootPublicKey: PublicKey,
    scalar: bigint,
): PublicKey => {
    console.time('generateChildPublicKey()');
    const childPublicKey = babyjub.mulPointEscalar(rootPublicKey, scalar);
    assertInSnarkField(childPublicKey[0], 'Child public key X');
    assertInSnarkField(childPublicKey[1], 'Child public key Y');
    console.timeEnd('generateChildPublicKey()');
    return childPublicKey;
};

export const multiplyScalars = (a: bigint, b: bigint): bigint => {
    assertInBabyJubJubSubOrder(a, 'Scalar a');
    assertInBabyJubJubSubOrder(b, 'Scalar b');
    return (a * b) % babyjub.subOrder;
};

export const packPublicKey = babyjub.packPoint;
export const unpackPublicKey = babyjub.unpackPoint;

export const deriveKeypairFromSignature = (signature: string): IKeypair => {
    const pKey = derivePrivateKeyFromSignature(signature);
    return deriveKeypairFromSeed(pKey);
};

export const moduloSnarkFieldPrime = (v: bigint): bigint => {
    // The public keys need to be truncated in the SNARK field.
    return v % SNARK_FIELD_SIZE;
};

export function moduloBabyJubSubFiledPrime(v: bigint): bigint {
    // The private key lives in the scalar field of the babyjubjub suborder.
    return v % babyjub.subOrder;
}

export const derivePublicKeyFromPrivate = (
    privateKey: PrivateKey,
): PublicKey => {
    assertInBabyJubJubSubOrder(privateKey, 'privateKey');
    const pubKey = babyjub.mulPointEscalar(babyjub.Base8, privateKey);
    assertInSnarkField(pubKey[0], 'public key X');
    assertInSnarkField(pubKey[1], 'public key Y');
    return pubKey;
};

const generateRandom256Bits = (): bigint => {
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

export const generateRandomInBabyJubSubField = (): bigint => {
    const random = moduloBabyJubSubFiledPrime(generateRandom256Bits());
    assertInBabyJubJubSubOrder(random, 'random');
    return random;
};

export const extractSecretsPair = (
    signature: string,
): [r: bigint, s: bigint] => {
    if (!signature) {
        throw new Error('Signature must be provided');
    }
    assert(
        signature.length === 132,
        `Tried to create keypair from signature of length '${signature.length}'`,
    );
    assert(
        signature.slice(0, 2) === '0x',
        `Tried to create keypair from signature without 0x prefix`,
    );
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

export const derivePrivateKeyFromSignature = (signature: string): bigint => {
    const pair = extractSecretsPair(signature);
    if (!pair) {
        throw new Error('Failed to extract secrets pair from signature');
    }
    const privKey = moduloBabyJubSubFiledPrime(poseidon(pair));
    assertInBabyJubJubSubOrder(privKey, 'privateKey');
    return privKey;
};
