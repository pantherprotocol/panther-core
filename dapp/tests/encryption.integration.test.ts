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

        const plaintext = [
            childRandomKeypair.privateKey.toString(16),
            BigInt(99).toString(16),
            BigInt(999).toString(16),
        ].join('');

        const ciphertext = encryptMessage(plaintext, spendingEcdhSharedKey);

        const decryptedCiphertext = decryptMessage(
            ciphertext,
            readingEcdhSharedKey,
        );

        expect(decryptedCiphertext).toEqual(plaintext);

        for (let i = 0; i < decryptedCiphertext.length; i++) {
            expect(decryptedCiphertext[i]).toEqual(plaintext[i]);
        }
    });
});
