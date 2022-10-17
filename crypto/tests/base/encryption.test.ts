import {describe, expect} from '@jest/globals';

import {
    generateEcdhSharedKey,
    encryptPlainText,
    decryptCipherText,
} from '../../src/base/encryption';
import {generateRandomKeypair, packPublicKey} from '../../src/base/keypairs';
import {SNARK_FIELD_SIZE} from '../../src/base/field-operations';
import {extractCipherKeyAndIvFromPackedPoint} from '../../src/panther/messages';
import {
    bigIntToUint8Array,
    uint8ArrayToBigInt,
} from '../../src/utils/bigint-conversions';

describe('Cryptographic operations', () => {
    const keypair1 = generateRandomKeypair();
    const keypair2 = generateRandomKeypair();

    const ecdhSharedKey12 = generateEcdhSharedKey(
        keypair1.privateKey,
        keypair2.publicKey,
    );
    const ecdhSharedKey21 = generateEcdhSharedKey(
        keypair2.privateKey,
        keypair1.publicKey,
    );

    const plaintext = generateRandomKeypair().privateKey;
    const {iv: ivSpending, cipherKey: ckSpending} =
        extractCipherKeyAndIvFromPackedPoint(packPublicKey(ecdhSharedKey12));
    const ciphertext = encryptPlainText(
        bigIntToUint8Array(plaintext),
        ckSpending,
        ivSpending,
    );

    const {iv: ivReading, cipherKey: ckReading} =
        extractCipherKeyAndIvFromPackedPoint(packPublicKey(ecdhSharedKey21));

    const decryptedCiphertext = uint8ArrayToBigInt(
        decryptCipherText(ciphertext, ckReading, ivReading),
    );

    describe('Private key', () => {
        it('should be smaller than the SNARK field size (BN254)', () => {
            expect(keypair1.privateKey < SNARK_FIELD_SIZE).toBeTruthy();
            // TODO: add tests to ensure that the prune buffer step worked
        });
    });

    describe("Public key's constituent values ", () => {
        it('should be smaller than the SNARK field size (BN254)', () => {
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
    });

    describe('Ciphertext', () => {
        it('should differ from the plaintext', () => {
            expect(bigIntToUint8Array(plaintext) !== ciphertext).toBeTruthy();
        });

        it('should have 32 bytes of data', () => {
            expect(ciphertext.length).toEqual(32);
        });
    });

    describe('The decrypted ciphertext', () => {
        it('should be correct', () => {
            expect(decryptedCiphertext.toString()).toEqual(
                plaintext.toString(),
            );
        });
    });
});
