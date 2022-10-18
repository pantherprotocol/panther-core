import crypto from 'crypto';

import {babyjub} from 'circomlibjs';

import {PrivateKey, PublicKey, EcdhSharedKey} from '../types/keypair';
import {ICiphertext} from '../types/message';

export function generateEcdhSharedKey(
    privateKey: PrivateKey,
    publicKey: PublicKey,
): EcdhSharedKey {
    return babyjub.mulPointEscalar(publicKey, privateKey);
}

export function encryptPlainText(
    plaintext: Uint8Array,
    cipherKey: Uint8Array,
    iv: Uint8Array,
): ICiphertext {
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

export function decryptCipherText(
    ciphertext: ICiphertext,
    cipherKey: Uint8Array,
    iv: Uint8Array,
): Uint8Array {
    const decipher = crypto.createDecipheriv('aes-128-cbc', cipherKey, iv);
    decipher.setAutoPadding(false);

    return new Uint8Array([
        ...decipher.update(ciphertext),
        ...decipher.final(),
    ]);
}
