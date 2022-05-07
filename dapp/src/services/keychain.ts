import {poseidon} from 'circomlibjs';
import {Signer} from 'ethers';

import {
    deriveKeypairFromSignature,
    multiplyScalars,
    deriveKeypairFromSeed,
} from '../lib/keychain';
import {IKeypair, PrivateKey} from '../lib/types';

// generateSpendingChildKeypair generates child spending keypair (s', S')
// using root spending private key and random scalar r as input.
export function generateSpendingChildKeypair(
    rootSpendingPrivKey: PrivateKey,
    r: bigint,
): IKeypair {
    const spendingChildPrivKey = multiplyScalars(rootSpendingPrivKey, r);
    return deriveKeypairFromSeed(spendingChildPrivKey);
}

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
