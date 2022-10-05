import {bigIntToUint8Array} from '@panther-core/crypto/lib/bigint-conversions';
import {ethers} from 'ethers';

import {
    deriveKeypairFromSignature,
    deriveKeypairFromSeed,
    packPublicKey,
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

        const secretRandom = childRandomKeypair.privateKey;

        const ciphertext = encryptMessage(
            bigIntToUint8Array(secretRandom, 32),
            packPublicKey(spendingEcdhSharedKey),
        );

        const decryptedSecretRandom = decryptMessage(
            ciphertext,
            packPublicKey(readingEcdhSharedKey),
        );

        expect(decryptedSecretRandom).toEqual(
            bigIntToUint8Array(secretRandom, 32),
        );

        expect(ciphertext.length).toEqual(32);
    });
});
