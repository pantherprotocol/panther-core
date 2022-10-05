import {
    bigIntToUint8Array,
    uint8ArrayToBigInt,
    bigintToBytes32,
    bigintToBytes,
} from '@panther-core/crypto/lib/bigint-conversions';

import {
    packPublicKey,
    generateRandomBabyJubValue,
    generatePublicKey,
    unpackPublicKey,
} from '../lib/keychain';
import {
    decryptMessage,
    encryptMessage,
    generateEcdhSharedKey,
} from '../lib/message-encryption';
import {PublicKey, ICiphertext, PrivateKey} from '../lib/types';

export const PROLOG = 'eeffeeff';

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
    console.time('encryptRandomSecret()');
    const ephemeralRandom = generateRandomBabyJubValue();
    const ephemeralPubKey = generateEcdhSharedKey(
        ephemeralRandom,
        rootReadingPubKey,
    );
    const ephemeralPubKeyPacked = packPublicKey(ephemeralPubKey);
    const ephemeralSharedPubKey = generatePublicKey(ephemeralRandom);
    const ephemeralSharedPubKeyPacked = packPublicKey(ephemeralSharedPubKey);
    const plaintext = bigintToBytes32(randomSecret).slice(2);

    const ciphertext = encryptMessage(
        bigIntToUint8Array(BigInt('0x' + plaintext), PRIV_KEY_SIZE),
        ephemeralPubKeyPacked,
    );

    const ephemeralSharedPubKeyPackedHex = bigintToBytes(
        uint8ArrayToBigInt(ephemeralSharedPubKeyPacked),
        PACKED_PUB_KEY_SIZE,
    ).slice(2);

    const dataHex = bigintToBytes(
        uint8ArrayToBigInt(ciphertext),
        PACKED_PUB_KEY_SIZE,
    ).slice(2);

    console.timeEnd('encryptRandomSecret()');
    return ephemeralSharedPubKeyPackedHex + dataHex;
}

export function decryptRandomSecret(
    ciphertextMsg: string,
    rootReadingPrivateKey: PrivateKey,
): bigint | undefined {
    console.time('decryptRandomSecret()');
    const [sharedKeyPacked, iCiphertext] = sliceCipherMsg(ciphertextMsg);
    const ephemeralSharedPubKey = unpackPublicKey(sharedKeyPacked);

    const ephemeralPubKey = generateEcdhSharedKey(
        rootReadingPrivateKey,
        ephemeralSharedPubKey,
    );
    let randomSecretHex;
    try {
        randomSecretHex = decryptMessage(
            iCiphertext,
            packPublicKey(ephemeralPubKey),
        );
    } catch (error) {
        throw new Error(`Failed to get random secret ${error}`);
    }
    console.timeEnd('decryptRandomSecret()');
    return uint8ArrayToBigInt(randomSecretHex);
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
