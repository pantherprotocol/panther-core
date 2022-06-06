import crypto from 'crypto';

import {bigintToBytes32} from '@panther-core/crypto/lib/bigint-conversions';
import {babyjub} from 'circomlibjs';
import {utils} from 'ethers';

import {formatPrivateKeyForBabyJub} from './keychain';
import {ICiphertext, PrivateKey, PublicKey, EcdhSharedKey} from './types';

export const generateEcdhSharedKey = (
    privateKey: PrivateKey,
    publicKey: PublicKey,
): EcdhSharedKey => {
    return babyjub.mulPointEscalar(
        publicKey,
        formatPrivateKeyForBabyJub(privateKey),
    )[0];
};

export function encryptMessage(
    plaintext: Uint8Array,
    sharedKey: EcdhSharedKey,
): ICiphertext {
    const iv = crypto.randomBytes(16);

    try {
        const cipher = crypto.createCipheriv(
            'aes-256-cbc',
            utils.arrayify(bigintToBytes32(sharedKey)),
            iv,
        );
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
    sharedKey: EcdhSharedKey,
): Uint8Array {
    const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        utils.arrayify(bigintToBytes32(sharedKey)),
        ciphertext.iv,
    );

    return new Uint8Array([
        ...decipher.update(ciphertext.data),
        ...decipher.final(),
    ]);
}
