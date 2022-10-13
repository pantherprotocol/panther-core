/*
Some of the functions are modified version or inspired by this code:
https://github.com/appliedzkp/maci/blob/master/crypto/ts/index.ts
*/

import crypto from 'crypto';

// @ts-ignore
import {babyjub, poseidon} from 'circomlibjs';
import {IKeypair, PrivateKey, PublicKey} from './types/keypair';
import {
    assertInSnarkField,
    assertInBabyJubJubSubOrder,
    assert,
} from './assertions';

// ALT_BN128 (also known as BN254) order and BabyJubJub field prime
export const SNARK_FIELD_SIZE = BigInt(
    '21888242871839275222246405745257275088548364400416034343698204186575808495617',
);
assert(babyjub.p === SNARK_FIELD_SIZE, 'SNARK field size mismatch');

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
    const rs = deriveChildPrivKeyFromRootPrivKey(
        rootKeypair.privateKey,
        randomSecret,
    );
    const rs_B = derivePublicKeyFromPrivate(rs);
    const s_rB = deriveChildPubKeyFromRootPubKey(
        rootKeypair.publicKey,
        randomSecret,
    );
    const isValid =
        childPubKey[0] === rs_B[0] &&
        childPubKey[1] === rs_B[1] &&
        s_rB[0] === childPubKey[0] &&
        s_rB[1] === childPubKey[1];

    console.debug(`generated public key is${isValid ? '' : ' NOT'} valid`);
    console.timeEnd('isChildPubKeyValid()');
    return isValid;
};

export const deriveKeypairFromPrivateKey = (privateKey: bigint): IKeypair => {
    assertInBabyJubJubSubOrder(privateKey, 'privateKey');
    const publicKey = derivePublicKeyFromPrivate(privateKey);
    return {privateKey, publicKey};
};

export const deriveKeypairFromSeed = (seed: bigint): IKeypair => {
    assert(seed != BigInt(0), 'Zero seed is not allowed');
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
    assertInBabyJubJubSubOrder(privateKey, 'privateKey');
    return babyjub.mulPointEscalar(babyjub.Base8, privateKey);
};

export const deriveChildPubKeyFromRootPubKey = (
    rootPubKey: PublicKey,
    random: bigint,
): PublicKey => {
    // MUST (not asserted here): rootPubKey to be generated from the babyjub.Base8
    assertInBabyJubJubSubOrder(random, 'random');
    assertInSnarkField(rootPubKey[0], 'Root public key X');
    assertInSnarkField(rootPubKey[1], 'Root public key Y');
    return babyjub.mulPointEscalar(rootPubKey, random);
};

export const derivePrivateKeyFromSignature = (signature: string): bigint => {
    const pair = extractSecretsPair(signature);
    if (!pair) {
        throw new Error('Failed to extract secrets pair from signature');
    }
    const privKey = moduloBabyJubSubFieldPrime(poseidon(pair));
    assertInBabyJubJubSubOrder(privKey, 'privateKey');
    return privKey;
};

export const deriveChildPrivKeyFromRootPrivKey = (
    rootPrivKey: PrivateKey,
    random: bigint,
): PrivateKey => {
    assertInBabyJubJubSubOrder(rootPrivKey, 'Root private key');
    assertInBabyJubJubSubOrder(random, 'Random');
    return moduloBabyJubSubFieldPrime(rootPrivKey * random);
};

export const packPublicKey = babyjub.packPoint;
export const unpackPublicKey = babyjub.unpackPoint;

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

export const generateRandomInBabyJubSubField = (): bigint => {
    const random = moduloBabyJubSubFieldPrime(generateRandom256Bits());
    assertInBabyJubJubSubOrder(random, 'random');
    return random;
};

export const moduloSnarkFieldPrime = (v: bigint | bigint): bigint => {
    return (v as bigint) % SNARK_FIELD_SIZE;
};

export const moduloBabyJubSubFieldPrime = (value: bigint) => {
    return (value as bigint) % babyjub.subOrder;
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
        moduloSnarkFieldPrime(BigInt('0x' + r)),
        moduloSnarkFieldPrime(BigInt('0x' + s)),
    ];
};
