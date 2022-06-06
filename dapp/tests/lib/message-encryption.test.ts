import {describe, expect} from '@jest/globals';
import {
    bigIntToUint8Array,
    uint8ArrayToBigInt,
} from '@panther-core/crypto/lib/bigint-conversions';

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

    const plaintext = deriveKeypairFromSeed().privateKey;
    const ciphertext = encryptMessage(
        bigIntToUint8Array(plaintext),
        ecdhSharedKey12,
    );
    const decryptedCiphertext = uint8ArrayToBigInt(
        decryptMessage(ciphertext, ecdhSharedKey21),
    );

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
            expect(
                bigIntToUint8Array(plaintext) !== ciphertext.data,
            ).toBeTruthy();
        });

        it('should be smaller than the snark field size', () => {
            expect(
                uint8ArrayToBigInt(ciphertext.iv) < SNARK_FIELD_SIZE,
            ).toBeTruthy();
        });

        it('should have 48 bytes of data', () => {
            expect(ciphertext.data.length).toEqual(48);
        });
    });

    describe('The decrypted ciphertext', () => {
        it('should be correct', () => {
            expect(decryptedCiphertext.toString()).toEqual(
                plaintext.toString(),
            );
        });

        it('should throw error if decryption is attempted with incorrect key', () => {
            const sk = BigInt(1);
            const randomKeypair = deriveKeypairFromSeed(sk);
            const differentKey = generateEcdhSharedKey(
                sk,
                randomKeypair.publicKey,
            );

            expect(() => {
                const decrypted = decryptMessage(ciphertext, differentKey);
                // this part only for debugging purposes:
                console.log('Diagnostics for sometimes failing test:', {
                    decrypted,
                    plaintext,
                    isTheSame: uint8ArrayToBigInt(decrypted) === plaintext,
                    differentKey,
                    ecdhSharedKey12,
                    decryptedCiphertext,
                });
            }).toThrow(/bad decrypt/);
        });
    });
});
