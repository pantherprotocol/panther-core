import {describe, expect} from '@jest/globals';
import {Wallet} from 'ethers';

import {
    derivePrivateKeyFromSignature,
    extractSecretsPair,
    SNARK_FIELD_SIZE,
} from '../src/lib/keychain';

describe('Keychain', () => {
    const randomAccount = Wallet.createRandom();
    let signature: string;

    beforeEach(async () => {
        const seedMsg = `I'm creating a Reading key for ${randomAccount.address}`;
        signature = await randomAccount.signMessage(seedMsg);
    });

    describe('Seed', () => {
        it('should be within SNARK_FIELD_SIZE', () => {
            expect(
                derivePrivateKeyFromSignature(signature) < SNARK_FIELD_SIZE,
            ).toBeTruthy();
        });
    });

    describe('Signature elements', () => {
        it('should be within SNARK_FIELD_SIZE', () => {
            const [r, s] = extractSecretsPair(signature);
            expect(r < SNARK_FIELD_SIZE).toBeTruthy();
            expect(s < SNARK_FIELD_SIZE).toBeTruthy();
        });

        it('should throw error if signature is not valid', () => {
            expect(() => extractSecretsPair('invalid signature')).toThrow(
                "Keychain error: Tried to create keypair from signature of length '17'",
            );
        });

        it('should throw error if signature is null', () => {
            expect(() => extractSecretsPair('')).toThrow(
                'Keychain error: Signature must be provided',
            );
        });

        it('should throw error if signature is not starting with 0x', () => {
            expect(() => extractSecretsPair('0'.repeat(132))).toThrow(
                'Keychain error: Tried to create keypair from signature without 0x prefix',
            );
        });
    });
});
