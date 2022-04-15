import {describe, expect} from '@jest/globals';
import {Wallet} from 'ethers';

import {
    deriveKeypairFromSignature,
    generateRandomKeypair,
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

    describe('Keypair', () => {
        it('should be smaller than snark FIELD_SIZE', () => {
            const keypair = deriveKeypairFromSignature(signature);
            expect(keypair.privateKey < SNARK_FIELD_SIZE).toBeTruthy();
            expect(keypair.publicKey[0] < SNARK_FIELD_SIZE).toBeTruthy();
            expect(keypair.publicKey[1] < SNARK_FIELD_SIZE).toBeTruthy();
        });

        it('should be deterministically generated', () => {
            const keypairOne = deriveKeypairFromSignature(signature);
            const keypairTwo = deriveKeypairFromSignature(signature);
            expect(keypairOne.privateKey).toEqual(keypairTwo.privateKey);
            expect(keypairOne.publicKey).toEqual(keypairTwo.publicKey);
        });
    });

    describe('Random keypair', () => {
        it('should be smaller than snark FIELD_SIZE', () => {
            const keypair = generateRandomKeypair();
            expect(keypair.privateKey < SNARK_FIELD_SIZE).toBeTruthy();
            expect(keypair.publicKey[0] < SNARK_FIELD_SIZE).toBeTruthy();
            expect(keypair.publicKey[1] < SNARK_FIELD_SIZE).toBeTruthy();
        });

        it('should not be deterministic', () => {
            const keypairOne = generateRandomKeypair();
            const keypairTwo = generateRandomKeypair();
            expect(keypairOne.privateKey).not.toEqual(keypairTwo.privateKey);
            expect(keypairOne.publicKey).not.toEqual(keypairTwo.publicKey);
        });
    });
});
