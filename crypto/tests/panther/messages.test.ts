import {describe, expect} from '@jest/globals';

import {generateRandomInBabyJubSubField} from '../../src/base/field-operations';
import {
    generateRandomKeypair,
    PACKED_PUB_KEY_SIZE,
} from '../../src/base/keypairs';
import {
    CIPHERTEXT_MSG_TYPE_V1_SIZE,
    unpackAndDecryptMessageTypeV1,
    encryptAndPackMessageTypeV1,
    unpackMessageTypeV1,
} from '../../src/panther/messages';

describe('Random secret encryption', () => {
    const rootReadingKeypair = generateRandomKeypair();
    const randomSecret = generateRandomInBabyJubSubField();

    const ciphertext = encryptAndPackMessageTypeV1(
        randomSecret,
        rootReadingKeypair.publicKey,
    );

    const [packedEphemeralPubKey, cipheredText] =
        unpackMessageTypeV1(ciphertext);

    const decrypted = unpackAndDecryptMessageTypeV1(
        ciphertext,
        rootReadingKeypair.privateKey,
    );

    it('should be decrypted and have correct message', () => {
        expect(decrypted).toEqual(randomSecret);
    });

    it('should have size of 64 bytes', () => {
        expect(ciphertext.length).toEqual(
            (PACKED_PUB_KEY_SIZE + CIPHERTEXT_MSG_TYPE_V1_SIZE) * 2, // 64 bytes
        );
    });

    it('should have a ciphertext of size 32 bytes', () => {
        expect(cipheredText.length).toEqual(CIPHERTEXT_MSG_TYPE_V1_SIZE); // 32 bytes
    });

    it('should have a packedEphemeralPubKey of size 32 bytes', () => {
        expect(packedEphemeralPubKey.length).toEqual(PACKED_PUB_KEY_SIZE); // 32 bytes
    });
});
