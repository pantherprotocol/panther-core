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

//TODO: Derivation message content to be defined in https://app.clickup.com/t/26gtpr4
export async function deriveRootKeypairs(signer: Signer): Promise<IKeypair[]> {
    const derivationMessage = `I'm creating a spending and reading keypairs for ${await signer.getAddress()}`;
    const signature = await signer.signMessage(derivationMessage);
    const hashedSignature = poseidon([signature]);
    return [
        deriveKeypairFromSignature(signature),
        deriveKeypairFromSeed(hashedSignature),
    ];
}
