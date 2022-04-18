import {decryptMessage, encryptMessage} from '../lib/message-encryption';
import {ICommitmentPlaintext, EcdhSharedKey, ICiphertext} from '../lib/types';

export const encryptCommitment = async (
    plaintext: ICommitmentPlaintext,
    key: EcdhSharedKey,
) => {
    const plaintextMessage = [
        plaintext.token,
        plaintext.amount,
        plaintext.random,
    ];
    return encryptMessage(plaintextMessage, key);
};

export const decryptCommitment = (
    ciphertext: ICiphertext,
    key: EcdhSharedKey,
): ICommitmentPlaintext => {
    const decryptedText = decryptMessage(ciphertext, key);
    return {
        token: decryptedText[0].valueOf(),
        amount: decryptedText[1].valueOf(),
        random: decryptedText[2].valueOf(),
    };
};
