import {
    bigIntToUint8Array,
    uint8ArrayToBigInt,
} from '@panther-core/crypto/lib/bigint-conversions';
import {
    deriveKeypairFromSignature,
    generateRandomKeypair,
    packPublicKey,
} from '@panther-core/crypto/lib/keychain';
import {babyjub} from 'circomlibjs';
import {Wallet} from 'ethers';

import {
    encryptMessage,
    generateEcdhSharedKey,
    decryptMessage,
} from '../src/lib/message-encryption';
import {extractCipherKeyAndIV} from '../src/services/message-encryption';

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
            extractCipherKeyAndIV(packedK);

        const C = encryptMessage(
            bigIntToUint8Array(BigInt('0x' + plainText)),
            ckSpending,
            ivSpending,
        );

        // sender calls the contract with data
        // and publishes S, R and C (packing of data is omitted)
        // const data = [
        //     Sprime[0],
        //     Sprime[1],
        //     ...
        //     [rR.publicKey, C],
        //     ...
        // ];

        // Receiver actions from here:
        const derivedK = generateEcdhSharedKey(vV.privateKey, rR.publicKey);
        const packedDerivedK = packPublicKey(derivedK);
        const {iv: ivReading, cipherKey: ckReading} =
            extractCipherKeyAndIV(packedDerivedK);
        const decryptedText = uint8ArrayToBigInt(
            decryptMessage(C, ckReading, ivReading),
        );
        const sPrime = babyjub.mulPointEscalar(rR.publicKey, sS.privateKey);

        expect(decryptedText.toString(16)).toEqual(plainText);
        expect(sPrime[0]).toEqual(Sprime[0]);
        expect(sPrime[1]).toEqual(Sprime[1]);
    });
});
