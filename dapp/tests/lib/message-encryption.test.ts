import {describe, expect} from '@jest/globals';

import {deriveKeypairFromSeed, SNARK_FIELD_SIZE} from '../../src/lib/keychain';
import {
    generateEcdhSharedKey,
    encryptMessage,
    decryptMessage,
} from '../../src/lib/message-encryption';

describe('Cryptographic operations', () => {
    const keypair1 = deriveKeypairFromSeed();
    const keypair2 = deriveKeypairFromSeed();

    const ecdhSharedKey12 = generateEcdhSharedKey(
        keypair1.privateKey,
        keypair2.publicKey,
    );
    const ecdhSharedKey21 = generateEcdhSharedKey(
        keypair2.privateKey,
        keypair1.publicKey,
    );

    const plaintext: any[] = [];
    for (let i = 0; i < 5; i++) {
        plaintext.push(BigInt(Math.floor(Math.random() * 50)));
    }

    const ciphertext = encryptMessage(plaintext, ecdhSharedKey12);
    const decryptedCiphertext = decryptMessage(ciphertext, ecdhSharedKey12);

    describe('Private key', () => {
        it('should be smaller than the snark field size', () => {
            expect(keypair1.privateKey < SNARK_FIELD_SIZE).toBeTruthy();
            // TODO: add tests to ensure that the prune buffer step worked
        });
    });

    describe("Public key's constituent values ", () => {
        it('should be smaller than the snark field size', () => {
            // TODO: Figure out if these checks are correct and enough
            expect(keypair1.publicKey[0] < SNARK_FIELD_SIZE).toBeTruthy();
            expect(keypair1.publicKey[1] < SNARK_FIELD_SIZE).toBeTruthy();
        });
    });

    describe('ECDH shared keys', () => {
        it('should match', () => {
            expect(ecdhSharedKey12.toString()).toEqual(
                ecdhSharedKey21.toString(),
            );
        });

        it('should be smaller than the snark field size', () => {
            // TODO: Figure out if this check is correct and enough
            expect(ecdhSharedKey12 < SNARK_FIELD_SIZE).toBeTruthy();
        });
    });

    describe('Ciphertext', () => {
        it('should be of the correct format', () => {
            expect(ciphertext).toHaveProperty('iv');
            expect(ciphertext).toHaveProperty('data');
            expect(ciphertext.data.length).toBeGreaterThan(0);
        });

        it('should differ from the plaintext', () => {
            const stringifyPlainTest = JSON.stringify(plaintext, (key, value) =>
                typeof value === 'bigint' ? value.toString() + 'n' : value,
            );

            expect(stringifyPlainTest !== ciphertext.data).toBeTruthy();
        });

        it('should be smaller than the snark field size', () => {
            expect(
                BigInt(`0x${ciphertext.iv.toString('hex')}`) < SNARK_FIELD_SIZE,
            ).toBeTruthy();
        });
    });

    describe('The decrypted ciphertext', () => {
        it('should be correct', () => {
            expect.assertions(decryptedCiphertext.length);

            for (let i = 0; i < decryptedCiphertext.length; i++) {
                expect(decryptedCiphertext[i]).toEqual(plaintext[i]);
            }
        });

        it('should be incorrect if decrypted with a different key', () => {
            const sk = BigInt(1);
            const randomKeypair = deriveKeypairFromSeed(sk);
            const differentKey = generateEcdhSharedKey(
                sk,
                randomKeypair.publicKey,
            );

            expect(() => decryptMessage(ciphertext, differentKey)).toThrow(
                'Failed to decrypt message',
            );
        });
    });
});
