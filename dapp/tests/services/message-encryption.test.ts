import {describe, expect} from '@jest/globals';
import {
    bigIntToUint8Array,
    uint8ArrayToBigInt,
    bigintToBytes32,
} from '@panther-core/crypto/lib/bigint-conversions';

import {
    deriveKeypairFromSeed,
    generateRandomBabyJubValue,
    packPublicKey,
    unpackPublicKey,
} from '../../src/lib/keychain';
import {
    generateEcdhSharedKey,
    decryptMessage,
} from '../../src/lib/message-encryption';
import {PrivateKey} from '../../src/lib/types';
import {
    encryptRandomSecret,
    PROLOG,
} from '../../src/services/message-encryption';

function decryptEphemeralKey(
    encrypted: string,
    rootReadingPrivateKey: PrivateKey,
): any {
    const ivHex = encrypted.slice(0, 32);
    const ephemeralSharePubKeyPackedHex = encrypted.slice(32, 96);
    const ephemeralSharePubKeyPacked = bigIntToUint8Array(
        BigInt('0x' + ephemeralSharePubKeyPackedHex),
        32,
    );
    const iv = bigIntToUint8Array(BigInt('0x' + ivHex), 16);
    const dataHex = encrypted.slice(96);
    const data = bigIntToUint8Array(BigInt('0x' + dataHex), 48);

    const ephemeralSharedPubKey = unpackPublicKey(ephemeralSharePubKeyPacked);
    const ephemeralPubKey = generateEcdhSharedKey(
        rootReadingPrivateKey,
        ephemeralSharedPubKey,
    );

    return {
        ephemeralPubKey,
        iv,
        data,
        msg: uint8ArrayToBigInt(
            decryptMessage({iv, data}, packPublicKey(ephemeralPubKey)),
        ).toString(16),
    };
}

describe('Random secret encryption', () => {
    const rootReadingKeypair = deriveKeypairFromSeed();
    const randomSecret = generateRandomBabyJubValue();

    const ciphertext = encryptRandomSecret(
        randomSecret,
        rootReadingKeypair.publicKey,
    );

    const decrypted = decryptEphemeralKey(
        ciphertext,
        rootReadingKeypair.privateKey,
    );

    it('should be decrypted and have correct message', () => {
        expect(decrypted.msg).toEqual(
            PROLOG + bigintToBytes32(randomSecret).slice(2),
        );
    });

    it('should fail to decrypt with a different key', () => {
        const differentKey = BigInt(1);
        expect(() =>
            decryptEphemeralKey(ciphertext, differentKey),
        ).toThrowError(/bad decrypt/);
    });
});
