import {
    bigIntToUint8Array,
    uint8ArrayToBigInt,
} from '@panther-core/crypto/lib/bigint-conversions';
import {ethers} from 'ethers';

import {
    deriveKeypairFromSignature,
    deriveKeypairFromSeed,
} from '../src/lib/keychain';
import {
    encryptMessage,
    generateEcdhSharedKey,
    decryptMessage,
} from '../src/lib/message-encryption';
import {IKeypair} from '../src/lib/types/keypair';

describe('Message encryption and decryption', () => {
    it('expect decrypt message to be equal initial plain message', async () => {
        const signer = ethers.Wallet.createRandom();

        const signature = await signer.signMessage('some message');

        const readingKeypair: IKeypair = deriveKeypairFromSignature(signature);
        // spending keypair(R,r)
        const childRandomKeypair = deriveKeypairFromSeed();

        // generates by sender ECDH(rootReadingPubKey, r)
        const spendingEcdhSharedKey = generateEcdhSharedKey(
            childRandomKeypair.privateKey,
            readingKeypair.publicKey,
        );

        // generates by recipient ECDH(R, rootReadingPrivKey)
        const readingEcdhSharedKey = generateEcdhSharedKey(
            readingKeypair.privateKey,
            childRandomKeypair.publicKey,
        );

        const prolog = 'deadbeef';
        const plaintext = prolog + childRandomKeypair.privateKey.toString(16);

        const ciphertext = encryptMessage(
            bigIntToUint8Array(BigInt('0x' + plaintext), 36),
            spendingEcdhSharedKey,
        );

        const decryptedCiphertext = uint8ArrayToBigInt(
            decryptMessage(ciphertext, readingEcdhSharedKey),
        ).toString(16);

        expect(decryptedCiphertext).toEqual(plaintext);

        for (let i = 0; i < decryptedCiphertext.length; i++) {
            expect(decryptedCiphertext[i]).toEqual(plaintext[i]);
        }

        expect(ciphertext.data.length).toEqual(48);
    });
});
