import crypto from 'node:crypto';

import {babyjub} from 'circomlibjs';
import {ethers} from 'ethers';

import {formatPrivateKeyForBabyJub} from './keychain';
import {
    ICiphertext,
    Plaintext,
    PrivateKey,
    PublicKey,
    EcdhSharedKey,
} from './types';

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
    plaintext: Plaintext,
    sharedKey: EcdhSharedKey,
): ICiphertext {
    const iv = crypto.randomBytes(16);

    const key = ethers.utils.arrayify(
        ethers.utils.hexZeroPad(ethers.utils.hexlify(sharedKey), 32),
    );

    const data = JSON.stringify(plaintext, (key, value) =>
        typeof value === 'bigint' ? value.toString() + 'n' : value,
    );

    try {
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        const firstChunk = cipher.update(data);
        const secondChunk = cipher.final();

        return {
            iv,
            data: Buffer.concat([firstChunk, secondChunk]).toString('hex'),
        };
    } catch (error) {
        throw Error(`Failed to encrypt message: ${error}`);
    }
}

export function decryptMessage(
    ciphertext: ICiphertext,
    sharedKey: EcdhSharedKey,
): Plaintext {
    const iv = ciphertext.iv;

    const key = ethers.utils.arrayify(
        ethers.utils.hexZeroPad(ethers.utils.hexlify(sharedKey), 32),
    );

    const cipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    const firstChunk = cipher.update(Buffer.from(ciphertext.data, 'hex'));
    const secondChunk = cipher.final();
    const result = Buffer.concat([firstChunk, secondChunk]);

    return JSON.parse(result.toString(), (key, value) => {
        if (typeof value === 'string' && /^\d+n$/.test(value)) {
            return BigInt(value.substr(0, value.length - 1));
        }
        return value;
    });
}
