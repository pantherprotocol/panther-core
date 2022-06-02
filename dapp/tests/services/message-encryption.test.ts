import {describe, expect} from '@jest/globals';
import {
    bigIntToUint8Array,
    uint8ArrayToBigInt,
    bigintToBytes32,
} from '@panther-core/crypto/lib/bigint-conversions';

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
    const dataHex = encrypted.slice(96);
    const data = bigIntToUint8Array(BigInt('0x' + dataHex), 48);

    return {
        ephemeralPublicKeyX,
        iv,
        data,
        msg: uint8ArrayToBigInt(decryptMessage({iv, data}, ecdhKey)).toString(
            16,
        ),
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
            PROLOG + bigintToBytes32(ephemeralKeypair.privateKey).slice(2),
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
