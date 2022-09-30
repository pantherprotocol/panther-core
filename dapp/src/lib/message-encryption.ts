import crypto from 'crypto';

import {babyjub} from 'circomlibjs';

import {
    ICiphertext,
    PrivateKey,
    PublicKey,
    EcdhSharedKey,
    PackedEcdhSharedKey,
} from './types';

export const generateEcdhSharedKey = (
    privateKey: PrivateKey,
    publicKey: PublicKey,
): EcdhSharedKey => {
    return babyjub.mulPointEscalar(publicKey, privateKey);
};

function extractCipherKeyAndIV(packedKey: PackedEcdhSharedKey): {
    cipherKey: Buffer;
    iv: Buffer;
} {
    return {
        cipherKey: Buffer.from(packedKey).slice(0, 16),
        iv: Buffer.from(packedKey).slice(16, 32),
    };
}

export function encryptMessage(
    plaintext: Uint8Array,
    sharedKey: PackedEcdhSharedKey,
): ICiphertext {
    const {cipherKey, iv} = extractCipherKeyAndIV(sharedKey);

    try {
        const cipher = crypto.createCipheriv('aes-128-cbc', cipherKey, iv);
        cipher.setAutoPadding(false);
        const cipheredText1 = cipher.update(plaintext);
        const cipheredText2 = cipher.final();
        return new Uint8Array([...cipheredText1, ...cipheredText2]);
    } catch (error) {
        throw Error(`Failed to encrypt message: ${error}`);
    }
}

export function decryptMessage(
    ciphertext: ICiphertext,
    sharedKey: PackedEcdhSharedKey,
): Uint8Array {
    const {cipherKey, iv} = extractCipherKeyAndIV(sharedKey);
    const decipher = crypto.createDecipheriv('aes-128-cbc', cipherKey, iv);
    decipher.setAutoPadding(false);

    return new Uint8Array([
        ...decipher.update(ciphertext),
        ...decipher.final(),
    ]);
}
