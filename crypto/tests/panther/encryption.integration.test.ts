import {bigIntToUint8Array} from '../../src/utils/bigint-conversions';
import {
    deriveKeypairFromSignature,
    generateRandomKeypair,
    packPublicKey,
} from '../../src/base/keypairs';
import {
    encryptMessage,
    generateEcdhSharedKey,
    decryptMessage,
} from '../../src/base/encryption';
import {IKeypair} from '../../src/types/keypair';
import {extractCipherKeyAndIvFromPackedPoint} from '../../src/panther/messages';
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

        const {iv: ivSpending, cipherKey: ckSpending} =
            extractCipherKeyAndIvFromPackedPoint(
                packPublicKey(spendingEcdhSharedKey),
            );

        const ciphertext = encryptMessage(
            bigIntToUint8Array(secretRandom, 32),
            ckSpending,
            ivSpending,
        );

        const {iv: ivReading, cipherKey: ckReading} =
            extractCipherKeyAndIvFromPackedPoint(
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
