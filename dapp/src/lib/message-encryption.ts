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

export function encryptMessage(
    plaintext: Uint8Array,
    sharedKey: PackedEcdhSharedKey,
): ICiphertext {
    const iv = crypto.randomBytes(16);

    try {
        const cipher = crypto.createCipheriv('aes-256-cbc', sharedKey, iv);
        const cipheredText1 = cipher.update(plaintext);
        const cipheredText2 = cipher.final();
        return {
            iv: iv,
            data: new Uint8Array([...cipheredText1, ...cipheredText2]),
        };
    } catch (error) {
        throw Error(`Failed to encrypt message: ${error}`);
    }
}

export function decryptMessage(
    ciphertext: ICiphertext,
    sharedKey: PackedEcdhSharedKey,
): Uint8Array {
    const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        sharedKey,
        ciphertext.iv,
    );

    return new Uint8Array([
        ...decipher.update(ciphertext.data),
        ...decipher.final(),
    ]);
}
