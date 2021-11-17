import {
    generateKeypair,
    generateEcdhSharedKey,
    encryptMessage,
    decryptMessage,
    deriveKeypairFromSeed,
} from '../crypto';

import {describe, expect} from '@jest/globals';

const FIELD_SIZE = BigInt(
    '21888242871839275222246405745257275088548364400416034343698204186575808495617',
);

describe('Unit Test', () => {
    const a = 2;
    const b = 2;
    it('Should say 2+2=4', () => {
        expect(a + b).toEqual(4);
    });
});

describe('Cryptographic operations', () => {
    const keypair1 = generateKeypair();
    const keypair2 = generateKeypair();

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

    describe('Public and private keys', () => {
        it('A private key should be smaller than the snark field size', () => {
            expect(keypair1.privateKey < FIELD_SIZE).toBeTruthy();
            // TODO: add tests to ensure that the prune buffer step worked
        });

        it("A public key's constitutent values should be smaller than the snark field size", () => {
            // TODO: Figure out if these checks are correct and enough
            expect(keypair1.publicKey[0] < FIELD_SIZE).toBeTruthy();
            expect(keypair1.publicKey[1] < FIELD_SIZE).toBeTruthy();
        });
    });

    describe('ECDH shared key generation', () => {
        it('The shared keys should match', () => {
            expect(ecdhSharedKey12.toString()).toEqual(
                ecdhSharedKey21.toString(),
            );
        });

        it('A shared key should be smaller than the snark field size', () => {
            // TODO: Figure out if this check is correct and enough
            expect(ecdhSharedKey12 < FIELD_SIZE).toBeTruthy();
        });
    });

    describe('Encryption and decryption', () => {
        it('The ciphertext should be of the correct format', () => {
            expect(ciphertext).toHaveProperty('iv');
            expect(ciphertext).toHaveProperty('data');
            expect(ciphertext.data).toHaveLength(plaintext.length);
        });

        it('The ciphertext should differ from the plaintext', () => {
            expect.assertions(plaintext.length);
            for (let i = 0; i < plaintext.length; i++) {
                expect(plaintext[i] !== ciphertext.data[i + 1]).toBeTruthy();
            }
        });

        it('The ciphertext should be smaller than the snark field size', () => {
            expect(ciphertext.iv < FIELD_SIZE).toBeTruthy();
            for (let i = 0; i < ciphertext.data.length; i++) {
                // TODO: Figure out if this check is correct and enough
                expect(ciphertext.data[i] < FIELD_SIZE).toBeTruthy();
            }
        });

        it('The decrypted ciphertext should be correct', () => {
            expect.assertions(decryptedCiphertext.length);

            for (let i = 0; i < decryptedCiphertext.length; i++) {
                expect(decryptedCiphertext[i]).toEqual(plaintext[i]);
            }
        });

        it('The plaintext should be incorrect if decrypted with a different key', () => {
            const sk = BigInt(1);
            const randomKeypair = deriveKeypairFromSeed(sk);
            const differentKey = generateEcdhSharedKey(
                sk,
                randomKeypair.publicKey,
            );

            const invalidPlaintext = decryptMessage(ciphertext, differentKey);

            expect.assertions(invalidPlaintext.length);

            for (let i = 0; i < decryptedCiphertext.length; i++) {
                expect(invalidPlaintext[i] === plaintext[i]).toBeFalsy();
            }
        });
    });
});
