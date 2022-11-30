// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
import {poseidon} from 'circomlibjs';
import {Signer} from 'ethers';
import {
    moduloBabyJubSubFieldPrime,
    moduloSnarkFieldPrime,
} from '../base/field-operations';

import {
    deriveKeypairFromPrivKey,
    deriveChildPrivKeyFromRootPrivKey,
    deriveKeypairFromSeed,
    deriveChildPubKeyFromRootPubKey,
    isChildPubKeyValid,
} from '../base/keypairs';
import {IKeypair, PrivateKey} from '../types/keypair';

import {assertInBabyJubJubSubOrder, assert} from '../utils/assertions';

// generateSpendingChildKeypair generates child spending keypair (s', S')
// using root spending private key and random scalar r as input.
export function generateSpendingChildKeypair(
    rootSpendingPrivKey: PrivateKey,
    r: bigint,
): IKeypair {
    const spendingChildPrivKey = deriveChildPrivKeyFromRootPrivKey(
        rootSpendingPrivKey,
        r,
    );
    return deriveKeypairFromSeed(spendingChildPrivKey);
}

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

export const derivePrivKeyFromSignature = (signature: string): bigint => {
    const pair = extractSecretsPair(signature);
    if (!pair) {
        throw new Error('Failed to extract secrets pair from signature');
    }
    const privKey = moduloBabyJubSubFieldPrime(poseidon(pair));
    assertInBabyJubJubSubOrder(privKey, 'privateKey');
    return privKey;
};

export const deriveKeypairFromSignature = (signature: string): IKeypair => {
    const pKey = derivePrivKeyFromSignature(signature);
    return deriveKeypairFromPrivKey(pKey);
};

export async function deriveRootKeypairs(signer: Signer): Promise<IKeypair[]> {
    const derivationMessage = `Greetings from Panther Protocol!

Sign this message in order to obtain the keys to your Panther wallet.

This signature will not cost you any fees.

Keypair version: 1`;
    const signature = await signer.signMessage(derivationMessage);
    const hashedSignature = poseidon([signature]);
    return [
        deriveKeypairFromSignature(signature),
        deriveKeypairFromSeed(hashedSignature),
    ];
}

export function deriveSpendingChildKeypair(
    rootSpendingKeypair: IKeypair,
    randomSecret: bigint,
): [IKeypair, boolean] {
    const childSpendingPrivateKey = deriveChildPrivKeyFromRootPrivKey(
        rootSpendingKeypair.privateKey,
        randomSecret,
    );

    const spendingChildPubKey = deriveChildPubKeyFromRootPubKey(
        rootSpendingKeypair.publicKey,
        randomSecret,
    );

    const isValid = isChildPubKeyValid(
        spendingChildPubKey,
        rootSpendingKeypair,
        randomSecret,
    );

    return [
        {privateKey: childSpendingPrivateKey, publicKey: spendingChildPubKey},
        isValid,
    ];
}
