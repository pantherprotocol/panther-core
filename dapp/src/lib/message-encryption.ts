import {mimc7, babyjub} from 'circomlibjs';

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

export const encryptMessage = (
    plaintext: Plaintext,
    sharedKey: EcdhSharedKey,
): ICiphertext => {
    const iv = mimc7.multiHash(plaintext, BigInt(0));

    const ciphertext: ICiphertext = {
        iv,
        data: plaintext.map((e: BigInt, i: number): bigint => {
            return e + mimc7.hash(sharedKey, iv + BigInt(i));
        }),
    };
    return ciphertext;
};

export const decryptMessage = (
    ciphertext: ICiphertext,
    sharedKey: EcdhSharedKey,
): Plaintext => {
    return ciphertext.data.map((e: bigint, i: number): BigInt => {
        return (
            BigInt(e) -
            BigInt(mimc7.hash(sharedKey, BigInt(ciphertext.iv) + BigInt(i)))
        );
    });
};
