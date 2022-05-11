import crypto from 'crypto';

import {babyjub} from 'circomlibjs';
import {utils} from 'ethers';

import {bigintToBytes32} from './conversions';
import {formatPrivateKeyForBabyJub} from './keychain';
import {ICiphertext} from './types/message';
import {PrivateKey, PublicKey, EcdhSharedKey} from './types/keypair';

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
    plaintext: string,
    sharedKey: EcdhSharedKey,
): ICiphertext {
    const iv = crypto.randomBytes(16);

    try {
        const cipher = crypto.createCipheriv(
            'aes-256-cbc',
            utils.arrayify(bigintToBytes32(sharedKey)),
            iv,
        );
        return {
            iv: iv.toString('hex'),
            data: cipher.update(plaintext, 'utf8', 'hex') + cipher.final('hex'),
        };
    } catch (error) {
        throw Error(`Failed to encrypt message: ${error}`);
    }
}

export function decryptMessage(
    ciphertext: ICiphertext,
    sharedKey: EcdhSharedKey,
): string {
    const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        utils.arrayify(bigintToBytes32(sharedKey)),
        Buffer.from(ciphertext.iv, 'hex'),
    );

    return (
        decipher.update(ciphertext.data, 'hex', 'utf8') + decipher.final('utf8')
    );
}
