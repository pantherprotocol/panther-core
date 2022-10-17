import {
    decryptMessage,
    encryptMessage,
    generateEcdhSharedKey,
} from '../base/encryption';
import {
    packPublicKey,
    generateRandomInBabyJubSubField,
    derivePublicKeyFromPrivate,
    unpackPublicKey,
} from '../base/keypairs';
import {PublicKey, PrivateKey, PackedEcdhSharedKey} from '../types/keypair';
import {ICiphertext} from '../types/message';
import {
    bigIntToUint8Array,
    uint8ArrayToBigInt,
    bigintToBytes32,
    bigintToBytes,
} from '../utils/bigint-conversions';

// sizes in bytes according to NewCommitments docs:
// https://docs.google.com/document/d/11oY8TZRPORDP3p5emL09pYKIAQTadNhVPIyZDtMGV8k
export const PACKED_PUB_KEY_SIZE = 32;
export const PRIV_KEY_SIZE = 32;
export const CIPHERTEXT_MSG_SIZE = 32;

// encryptRandomSecret creates a message with encrypted randomSecret
// of the following format:
// msg = [IV, packedR, ...encrypted(prolog, r)]
export function encryptRandomSecret(
    randomSecret: bigint,
    rootReadingPubKey: PublicKey,
): string {
    const ephemeralRandom = generateRandomInBabyJubSubField();
    const ephemeralPubKey = generateEcdhSharedKey(
        ephemeralRandom,
        rootReadingPubKey,
    );
    const ephemeralPubKeyPacked = packPublicKey(ephemeralPubKey);
    const ephemeralSharedPubKey = derivePublicKeyFromPrivate(ephemeralRandom);
    const ephemeralSharedPubKeyPacked = packPublicKey(ephemeralSharedPubKey);
    const plaintext = bigintToBytes32(randomSecret).slice(2);
    const {cipherKey, iv} = extractCipherKeyAndIvFromPackedPoint(
        ephemeralPubKeyPacked,
    );

    const ciphertext = encryptMessage(
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

export function decryptRandomSecret(
    ciphertextMsg: string,
    rootReadingPrivateKey: PrivateKey,
): bigint | undefined {
    const [sharedKeyPacked, iCiphertext] = sliceCipherMsg(ciphertextMsg);
    const ephemeralSharedPubKey = unpackPublicKey(sharedKeyPacked);

    const ephemeralPubKey = generateEcdhSharedKey(
        rootReadingPrivateKey,
        ephemeralSharedPubKey,
    );

    const {cipherKey, iv} = extractCipherKeyAndIvFromPackedPoint(
        packPublicKey(ephemeralPubKey),
    );

    let randomSecretUInt8;
    try {
        randomSecretUInt8 = decryptMessage(iCiphertext, cipherKey, iv);
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
    packedKey: PackedEcdhSharedKey,
): {
    cipherKey: Buffer;
    iv: Buffer;
} {
    return {
        cipherKey: Buffer.from(packedKey).slice(0, 16),
        iv: Buffer.from(packedKey).slice(16, 32),
    };
}

export function sliceCipherMsg(
    ciphertextMsg: string,
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
    const ephemeralPublicKeyWidth = PACKED_PUB_KEY_SIZE * 2;
    const ciphertextWidth = CIPHERTEXT_MSG_SIZE * 2;

    if (ciphertextMsg.length != ephemeralPublicKeyWidth + ciphertextWidth) {
        throw `Message must be equal to ${
            ephemeralPublicKeyWidth + ciphertextWidth
        }`;
    }

    const packedEphemeralPubKeyHex = ciphertextMsg.slice(
        0,
        ephemeralPublicKeyWidth,
    );
    const packedEphemeralPubKey = bigIntToUint8Array(
        BigInt('0x' + packedEphemeralPubKeyHex),
        PACKED_PUB_KEY_SIZE,
    );
    console.debug(
        `packedEphemeralPubKey: ${packedEphemeralPubKeyHex} with ${packedEphemeralPubKey.length} bytes`,
    );

    const cipheredTextHex = ciphertextMsg.slice(ephemeralPublicKeyWidth);
    const cipheredText = bigIntToUint8Array(
        BigInt('0x' + cipheredTextHex),
        CIPHERTEXT_MSG_SIZE,
    );
    console.debug(
        `cipheredText: ${cipheredTextHex} with ${cipheredText.length} bytes`,
    );

    return [packedEphemeralPubKey, cipheredText];
}
