import {
    bigIntToUint8Array,
    uint8ArrayToBigInt,
    bigintToBytes32,
    bigintToBytes,
} from '@panther-core/crypto/lib/bigint-conversions';

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

    const plaintext =
        PROLOG + bigintToBytes32(ephemeralKeypair.privateKey).slice(2);

    const ciphertext = encryptMessage(
        bigIntToUint8Array(BigInt('0x' + plaintext), 36),
        ecdhKey,
    );

    return (
        bigintToBytes32(ephemeralKeypair.publicKey[0]).slice(2) +
        bigintToBytes(uint8ArrayToBigInt(ciphertext.iv), 16).slice(2) +
        bigintToBytes(uint8ArrayToBigInt(ciphertext.data), 48).slice(2)
    );
}
