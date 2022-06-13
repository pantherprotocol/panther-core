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
export const PROLOG_SIZE = 4;
export const IV_SIZE = 16;
export const PACKED_PUB_KEY_SIZE = 32;
export const PRIV_KEY_SIZE = 32;
export const CIPHERTEXT_MSG_SIZE = 48;

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
    const plaintext = PROLOG + bigintToBytes32(randomSecret).slice(2);

    const ciphertext = encryptMessage(
        bigIntToUint8Array(
            BigInt('0x' + plaintext),
            PRIV_KEY_SIZE + PROLOG_SIZE,
        ),
        ephemeralPubKeyPacked,
    );

    const ephemeralSharedPubKeyPackedHex = bigintToBytes(
        uint8ArrayToBigInt(ephemeralSharedPubKeyPacked),
        PACKED_PUB_KEY_SIZE,
    ).slice(2);

    const ivHex = bigintToBytes(uint8ArrayToBigInt(ciphertext.iv), 16).slice(2);
    const dataHex = bigintToBytes(
        uint8ArrayToBigInt(ciphertext.data),
        PACKED_PUB_KEY_SIZE + IV_SIZE,
    ).slice(2);

    console.debug('ivHex', ivHex);
    console.debug(
        'ephemeralSharedPubKeyPackedHex',
        ephemeralSharedPubKeyPackedHex,
    );
    console.debug('dataHex', dataHex);

    console.timeEnd('encryptRandomSecret()');
    return ivHex + ephemeralSharedPubKeyPackedHex + dataHex;
}

export function decryptRandomSecret(
    ciphertextMsg: string,
    rootReadingPrivateKey: PrivateKey,
): bigint {
    console.time('decryptRandomSecret()');
    const [sharedKeyPacked, iCiphertext] = sliceCipherMsg(ciphertextMsg);
    const ephemeralSharedPubKey = unpackPublicKey(sharedKeyPacked);

    const ephemeralPubKey = generateEcdhSharedKey(
        rootReadingPrivateKey,
        ephemeralSharedPubKey,
    );

    const msg = decryptMessage(iCiphertext, packPublicKey(ephemeralPubKey));
    const randomSecret = sliceDecipheredMsg(msg);

    console.timeEnd('decryptRandomSecret()');
    return randomSecret;
}

export function sliceDecipheredMsg(msg: Uint8Array): bigint {
    if (msg.length != PRIV_KEY_SIZE + PROLOG_SIZE) {
        throw `Message must be equal to ${PRIV_KEY_SIZE + PROLOG_SIZE}`;
    }

    const prologValueHex = uint8ArrayToBigInt(
        msg.slice(0, PROLOG_SIZE),
    ).toString(16);

    if (prologValueHex !== PROLOG) {
        throw `Message must start with ${PROLOG}`;
    }

    return uint8ArrayToBigInt(
        msg.slice(PROLOG_SIZE, PROLOG_SIZE + PRIV_KEY_SIZE),
    );
}

export function sliceCipherMsg(
    ciphertextMsg: string,
): [Uint8Array, ICiphertext] {
    /*
    struct CiphertextMsg {
        IV, // 128 bit - 16 bytes
        EphemeralPublicKey, // 32 bytes (the packed form)
        EncryptedText // 48 bytes
    } // 96 bytes
    see: NewCommitments docs:
    https://docs.google.com/document/d/11oY8TZRPORDP3p5emL09pYKIAQTadNhVPIyZDtMGV8k
    */
    // sizes in Hex string:
    const ivWidth = IV_SIZE * 2;
    const ephemeralPublicKeyWidth = PACKED_PUB_KEY_SIZE * 2;
    const ciphertextWidth = CIPHERTEXT_MSG_SIZE * 2;

    if (
        ciphertextMsg.length !=
        ivWidth + ephemeralPublicKeyWidth + ciphertextWidth
    ) {
        throw `Message must be equal to ${
            ivWidth + ephemeralPublicKeyWidth + ciphertextWidth
        }`;
    }

    const ivHex = ciphertextMsg.slice(0, ivWidth);
    const iv = bigIntToUint8Array(BigInt('0x' + ivHex), IV_SIZE);
    console.debug(`iv: ${ivHex} with ${iv.length} bytes`);

    const packedEphemeralPubKeyHex = ciphertextMsg.slice(
        ivWidth,
        ivWidth + ephemeralPublicKeyWidth,
    );
    const packedEphemeralPubKey = bigIntToUint8Array(
        BigInt('0x' + packedEphemeralPubKeyHex),
        PACKED_PUB_KEY_SIZE,
    );
    console.debug(
        `packedEphemeralPubKey: ${packedEphemeralPubKeyHex} with ${packedEphemeralPubKey.length} bytes`,
    );

    const cipheredTextHex = ciphertextMsg.slice(
        ivWidth + ephemeralPublicKeyWidth,
    );
    const cipheredText = bigIntToUint8Array(
        BigInt('0x' + cipheredTextHex),
        CIPHERTEXT_MSG_SIZE,
    );
    console.debug(
        `cipheredText: ${cipheredTextHex} with ${cipheredText.length} bytes`,
    );

    return [packedEphemeralPubKey, {iv, data: cipheredText}];
}
