// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar
import {
    decryptCipherText,
    encryptPlainText,
    generateEcdhSharedKey,
} from '../base/encryption';
import {
    packPublicKey,
    derivePubKeyFromPrivKey,
    unpackPublicKey,
    PACKED_PUB_KEY_SIZE,
    PRIV_KEY_SIZE,
} from '../base/keypairs';
import {generateRandomInBabyJubSubField} from '../base/field-operations';
import {PublicKey, PrivateKey, ephemeralKeyPacked} from '../types/keypair';
import {ICiphertext} from '../types/message';
import {
    bigIntToUint8Array,
    uint8ArrayToBigInt,
    bigintToBytes32,
    bigintToBytes,
} from '../utils/bigint-conversions';

// sizes in bytes according to NewCommitments docs:
// https://docs.google.com/document/d/11oY8TZRPORDP3p5emL09pYKIAQTadNhVPIyZDtMGV8k
export const CIPHERTEXT_MSG_TYPE_V1_SIZE = 32;

// encryptRandomSecret creates a message with encrypted randomSecret
// of the following format:
// msg = [IV, packedR, ...encrypted(prolog, r)]
export function encryptAndPackMessageTypeV1(
    secret: bigint,
    rootReadingPubKey: PublicKey,
): string {
    const ephemeralRandom = generateRandomInBabyJubSubField();
    const ephemeralPubKey = generateEcdhSharedKey(
        ephemeralRandom,
        rootReadingPubKey,
    );
    const ephemeralPubKeyPacked = packPublicKey(ephemeralPubKey);
    const ephemeralSharedPubKey = derivePubKeyFromPrivKey(ephemeralRandom);
    const ephemeralSharedPubKeyPacked = packPublicKey(ephemeralSharedPubKey);
    const plaintext = bigintToBytes32(secret).slice(2);
    const {cipherKey, iv} = extractCipherKeyAndIvFromPackedPoint(
        ephemeralPubKeyPacked,
    );

    const ciphertext = encryptPlainText(
        bigIntToUint8Array(BigInt('0x' + plaintext), PRIV_KEY_SIZE),
        cipherKey,
        iv,
    );

    const ephemeralSharedPubKeyPackedHex = bigintToBytes(
        uint8ArrayToBigInt(ephemeralSharedPubKeyPacked),
        PACKED_PUB_KEY_SIZE,
    ).slice(2);

    const dataHex = bigintToBytes(
        uint8ArrayToBigInt(ciphertext),
        PACKED_PUB_KEY_SIZE,
    ).slice(2);

    return ephemeralSharedPubKeyPackedHex + dataHex;
}

export function unpackAndDecryptMessageTypeV1(
    ciphertextMsg: string,
    rootReadingPrivateKey: PrivateKey,
): bigint | undefined {
    const [ephemeralKeyPacked, iCiphertext] =
        unpackMessageTypeV1(ciphertextMsg);
    const ephemeralKey = unpackPublicKey(ephemeralKeyPacked);

    const ephemeralSharedKey = generateEcdhSharedKey(
        rootReadingPrivateKey,
        ephemeralKey,
    );

    const {cipherKey, iv} = extractCipherKeyAndIvFromPackedPoint(
        packPublicKey(ephemeralSharedKey),
    );

    let randomSecretUInt8;
    try {
        randomSecretUInt8 = decryptCipherText(iCiphertext, cipherKey, iv);
    } catch (error) {
        throw new Error(`Failed to get random secret ${error}`);
    }

    // check if first 5 most significant bits are zeros
    if ((randomSecretUInt8[0] & 0xf8) != 0x00) {
        throw new Error('Failed to decrypt random secret. Incorrect padding');
    }

    return uint8ArrayToBigInt(randomSecretUInt8);
}

export function extractCipherKeyAndIvFromPackedPoint(
    packedKey: ephemeralKeyPacked,
): {
    cipherKey: Buffer;
    iv: Buffer;
} {
    return {
        cipherKey: Buffer.from(packedKey).slice(0, 16),
        iv: Buffer.from(packedKey).slice(16, 32),
    };
}

export function unpackMessageTypeV1(
    ciphertextMessageTypeV1: string,
): [Uint8Array, ICiphertext] {
    /*
    struct CiphertextMsg {
        EphemeralPublicKey, // 32 bytes (the packed form)
        EncryptedText // 32 bytes
    } // 64 bytes

    see: NewCommitments docs:
    https://docs.google.com/document/d/11oY8TZRPORDP3p5emL09pYKIAQTadNhVPIyZDtMGV8k/edit#bookmark=id.vxygmc6485de
    */
    // sizes in Hex string:
    const ephemeralKeyWidth = PACKED_PUB_KEY_SIZE * 2;
    const ciphertextWidth = CIPHERTEXT_MSG_TYPE_V1_SIZE * 2;

    if (ciphertextMessageTypeV1.length != ephemeralKeyWidth + ciphertextWidth) {
        throw `Message must be equal to ${ephemeralKeyWidth + ciphertextWidth}`;
    }

    const ephemeralKeyPackedHex = ciphertextMessageTypeV1.slice(
        0,
        ephemeralKeyWidth,
    );
    const ephemeralKeyPacked = bigIntToUint8Array(
        BigInt('0x' + ephemeralKeyPackedHex),
        PACKED_PUB_KEY_SIZE,
    );

    const cipheredTextHex = ciphertextMessageTypeV1.slice(ephemeralKeyWidth);
    const cipheredText = bigIntToUint8Array(
        BigInt('0x' + cipheredTextHex),
        CIPHERTEXT_MSG_TYPE_V1_SIZE,
    );

    return [ephemeralKeyPacked, cipheredText];
}
