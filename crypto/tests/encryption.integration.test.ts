import {bigIntToUint8Array} from '@panther-core/crypto/lib/bigint-conversions';
import {
    deriveKeypairFromSignature,
    generateRandomKeypair,
    packPublicKey,
} from '@panther-core/crypto/lib/keychain';
import {
    encryptMessage,
    generateEcdhSharedKey,
    decryptMessage,
} from '@panther-core/crypto/lib/message-encryption';
import {IKeypair} from '@panther-core/crypto/lib/types/keypair';
import {extractCipherKeyAndIV} from '@panther-core/crypto/src/sdk/message-encryption';
import {ethers} from 'ethers';

describe('Message encryption and decryption', () => {
    it('expect decrypt message to be equal initial plain message', async () => {
        const signer = ethers.Wallet.createRandom();

        const signature = await signer.signMessage('some message');

        const readingKeypair: IKeypair = deriveKeypairFromSignature(signature);
        // spending keypair(R,r)
        const childRandomKeypair = generateRandomKeypair();

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

        const {iv: ivSpending, cipherKey: ckSpending} = extractCipherKeyAndIV(
            packPublicKey(spendingEcdhSharedKey),
        );

        const ciphertext = encryptMessage(
            bigIntToUint8Array(secretRandom, 32),
            ckSpending,
            ivSpending,
        );

        const {iv: ivReading, cipherKey: ckReading} = extractCipherKeyAndIV(
            packPublicKey(readingEcdhSharedKey),
        );

        const decryptedSecretRandom = decryptMessage(
            ciphertext,
            ckReading,
            ivReading,
        );

        expect(decryptedSecretRandom).toEqual(
            bigIntToUint8Array(secretRandom, 32),
        );

        expect(ciphertext.length).toEqual(32);
    });
});
