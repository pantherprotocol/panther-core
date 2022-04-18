import {describe, expect} from '@jest/globals';

import {deriveKeypairFromSeed, SNARK_FIELD_SIZE} from '../../src/lib/keychain';
import {generateEcdhSharedKey} from '../../src/lib/message-encryption';
import {ICiphertext, ICommitmentPlaintext} from '../../src/lib/types';
import {
    decryptCommitment,
    encryptCommitment,
} from '../../src/services/message-encryption';

describe('Cryptographic operations', () => {
    const keypair1 = deriveKeypairFromSeed();
    const keypair2 = deriveKeypairFromSeed();

    const ecdhSharedKey12 = generateEcdhSharedKey(
        keypair1.privateKey,
        keypair2.publicKey,
    );

    const plaintext: any[] = [];
    for (let i = 0; i < 3; i++) {
        plaintext.push(BigInt(Math.floor(Math.random() * 50)));
    }

    const commitmentPlainText: ICommitmentPlaintext = {
        token: plaintext[0],
        amount: plaintext[1],
        random: plaintext[2],
    };

    let ciphertext: ICiphertext;
    let decryptedCiphertext: ICommitmentPlaintext;
    beforeAll(async () => {
        ciphertext = await encryptCommitment(
            commitmentPlainText,
            ecdhSharedKey12,
        );
        decryptedCiphertext = await decryptCommitment(
            ciphertext,
            ecdhSharedKey12,
        );
    });

    describe('Ciphertext', () => {
        it('should be of the correct format', () => {
            expect(ciphertext).toHaveProperty('iv');
            expect(ciphertext).toHaveProperty('data');
            expect(ciphertext.data).toHaveLength(plaintext.length);
        });

        it('should differ from the plaintext', () => {
            expect.assertions(plaintext.length);
            for (let i = 0; i < plaintext.length; i++) {
                expect(plaintext[i] !== ciphertext.data[i]).toBeTruthy();
            }
        });

        it('should be smaller than the snark field size', () => {
            expect(ciphertext.iv < SNARK_FIELD_SIZE).toBeTruthy();
            for (const word of ciphertext.data) {
                // TODO: Figure out if this check is correct and enough
                expect(word < SNARK_FIELD_SIZE).toBeTruthy();
            }
        });
    });

    describe('The decrypted ciphertext', () => {
        it('should have the correct amount', () => {
            expect(decryptedCiphertext.amount).toEqual(
                commitmentPlainText.amount,
            );
        });
        it('should have the correct token', () => {
            expect(decryptedCiphertext.token).toEqual(
                commitmentPlainText.token,
            );
        });
        it('should have the correct random scalar', () => {
            expect(decryptedCiphertext.random).toEqual(
                commitmentPlainText.random,
            );
        });

        it('should be incorrect if decrypted with a different key', () => {
            const sk = BigInt(1);
            const randomKeypair = deriveKeypairFromSeed(sk);
            const differentKey = generateEcdhSharedKey(
                sk,
                randomKeypair.publicKey,
            );

            const invalidPlaintext = decryptCommitment(
                ciphertext,
                differentKey,
            );
            expect(
                invalidPlaintext.amount === commitmentPlainText.amount,
            ).toBeFalsy();
            expect(
                invalidPlaintext.token === commitmentPlainText.token,
            ).toBeFalsy();
            expect(
                invalidPlaintext.random === commitmentPlainText.random,
            ).toBeFalsy();
        });
    });
});
