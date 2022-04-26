import {bigintToBytes32} from '../lib/conversions';
import {encryptMessage, generateEcdhSharedKey} from '../lib/message-encryption';
import {IKeypair, PublicKey} from '../lib/types';

export const PROLOG = 'eeffeeff';

// encryptEphemeralKey creates a message with encrypted ephemeral key
// of the following format:
// msg = [IV, R.x, ...encrypted(prolog, r)]
export function encryptEphemeralKey(
    ephemeralKeypair: IKeypair,
    readingPublicKey: PublicKey,
): string {
    const ecdhKey = generateEcdhSharedKey(
        ephemeralKeypair.privateKey,
        readingPublicKey,
    );

    const plaintext = PROLOG + ephemeralKeypair.privateKey.toString(16);
    const ciphertext = encryptMessage(plaintext, ecdhKey);

    return (
        bigintToBytes32(ephemeralKeypair.publicKey[0]).slice(2) +
        ciphertext.iv +
        ciphertext.data
    );
}
