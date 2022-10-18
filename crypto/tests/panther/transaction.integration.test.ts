import {babyjub} from 'circomlibjs';
import {Wallet} from 'ethers';

import {
    encryptPlainText,
    generateEcdhSharedKey,
    decryptCipherText,
} from '../../src/base/encryption';
import {generateRandomKeypair, packPublicKey} from '../../src/base/keypairs';
import {deriveKeypairFromSignature} from '../../src/panther/keys';
import {extractCipherKeyAndIvFromPackedPoint} from '../../src/panther/messages';
import {
    bigIntToUint8Array,
    uint8ArrayToBigInt,
} from '../../src/utils/bigint-conversions';

/*
For the transaction flow details, please refer to MASP document:
https://docs.google.com/document/d/1BTWHstTgNKcapOe0PLQR41vbC0aEDYmbBenfzTq8TVs/

*/

describe('Transaction integration test', () => {
    it('should mimic sender and receiver', async () => {
        const v = Wallet.createRandom();
        const s = Wallet.createRandom();
        const msg = 'some deterministic message';
        const signedMessageByV = await v.signMessage(msg);
        const signedMessageByS = await s.signMessage(msg);
        const vV = deriveKeypairFromSignature(signedMessageByV);
        const sS = deriveKeypairFromSignature(signedMessageByS);

        // Sender actions:
        const rR = generateRandomKeypair(); // Random (r, R)
        const Sprime = babyjub.mulPointEscalar(sS.publicKey, rR.privateKey);

        const K = generateEcdhSharedKey(rR.privateKey, vV.publicKey);
        const packedK = packPublicKey(K);
        const plainText = rR.privateKey.toString(16);
        const {iv: ivSpending, cipherKey: ckSpending} =
            extractCipherKeyAndIvFromPackedPoint(packedK);

        const C = encryptPlainText(
            bigIntToUint8Array(BigInt('0x' + plainText)),
            ckSpending,
            ivSpending,
        );

        // Receiver actions from here:
        const derivedK = generateEcdhSharedKey(vV.privateKey, rR.publicKey);
        const packedDerivedK = packPublicKey(derivedK);
        const {iv: ivReading, cipherKey: ckReading} =
            extractCipherKeyAndIvFromPackedPoint(packedDerivedK);
        const decryptedText = uint8ArrayToBigInt(
            decryptCipherText(C, ckReading, ivReading),
        );
        const sPrime = babyjub.mulPointEscalar(rR.publicKey, sS.privateKey);

        expect(decryptedText.toString(16)).toEqual(plainText);
        expect(sPrime[0]).toEqual(Sprime[0]);
        expect(sPrime[1]).toEqual(Sprime[1]);
    });
});
