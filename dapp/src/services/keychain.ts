import {multiplyScalars, deriveKeypairFromSeed} from '../lib/keychain';
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
