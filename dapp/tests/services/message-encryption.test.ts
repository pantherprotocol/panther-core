import {describe, expect} from '@jest/globals';

import {bigintToBytes32} from '../../src/lib/conversions';
import {deriveKeypairFromSeed} from '../../src/lib/keychain';
import {
    generateEcdhSharedKey,
    decryptMessage,
} from '../../src/lib/message-encryption';
import {EcdhSharedKey} from '../../src/lib/types';
import {
    encryptEphemeralKey,
    PROLOG,
} from '../../src/services/message-encryption';

function decryptEphemeralKey(encrypted: string, ecdhKey: EcdhSharedKey): any {
    const ephemeralPublicKeyX = encrypted.slice(0, 64);
    const iv = encrypted.slice(64, 96);
    const data = encrypted.slice(96);

    return {
        ephemeralPublicKeyX,
        iv,
        data,
        msg: decryptMessage({iv, data}, ecdhKey),
    };
}

describe('Ephemeral key encryption', () => {
    const readingKeypair = deriveKeypairFromSeed();
    const ephemeralKeypair = deriveKeypairFromSeed();

    const ciphertext = encryptEphemeralKey(
        ephemeralKeypair,
        readingKeypair.publicKey,
    );

    const ecdh = generateEcdhSharedKey(
        ephemeralKeypair.privateKey,
        readingKeypair.publicKey,
    );

    const decrypted = decryptEphemeralKey(ciphertext, ecdh);

    it('should have correct R', () => {
        expect('0x' + decrypted.ephemeralPublicKeyX).toEqual(
            bigintToBytes32(ephemeralKeypair.publicKey[0]),
        );
    });

    it('should be decrypted and have correct message', () => {
        expect(decrypted.msg).toEqual(
            PROLOG + ephemeralKeypair.privateKey.toString(16),
        );
    });

    it('should fail to decrypt with a different key', () => {
        const sk = BigInt(1);
        const randomKeypair = deriveKeypairFromSeed(sk);
        const differentKey = generateEcdhSharedKey(sk, randomKeypair.publicKey);
        expect(() =>
            decryptEphemeralKey(ciphertext, differentKey),
        ).toThrowError(/bad decrypt/);
    });
});
