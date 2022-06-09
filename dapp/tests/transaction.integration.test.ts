import {
    bigIntToUint8Array,
    uint8ArrayToBigInt,
} from '@panther-core/crypto/lib/bigint-conversions';
import {babyjub} from 'circomlibjs';
import {Wallet} from 'ethers';

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

/*
Recipient reading key V = vB
Recipient master spending key S = sB
Recipient publishes V, B

Sender generates random r
Sender generates sender’s ephemeral key R = rB
Sender derives a shared key K=ECDH(V, r)  = rV = rvB
Sender encrypts with K the UTXO opening values
  M = (r, amount, token)
  Ciphertext C = Enc(M, K).
Sender derives the public spending key for a UTXO as S' = rS
Sender publishes R and C
  (the smart contract emits R, C, as well as creationTime and leafId)

Recipient derives shared key K = vR= vrB
Recipient decrypts ciphertext and gets the UTXO opening values
  (r, amount, token) = M = Dec(C, K)
Recipient derives the private spending key as s' = rs
Recipient computes the commitment and the nullifier
  commitment := Poseidon(S`.x, S`.y, amount, token, creationTime)
  nullifier := Poseidon(s, leafId)

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
        const rR = deriveKeypairFromSeed(); // Random (r, R)
        const Sprime = babyjub.mulPointEscalar(sS.publicKey, rR.privateKey);

        const K = generateEcdhSharedKey(rR.privateKey, vV.publicKey);
        const packedK = packPublicKey(K);
        const plainText = rR.privateKey.toString(16);
        const C = encryptMessage(
            bigIntToUint8Array(BigInt('0x' + plainText)),
            packedK,
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
        const decryptedText = uint8ArrayToBigInt(
            decryptMessage(C, packedDerivedK),
        );
        const sPrime = babyjub.mulPointEscalar(rR.publicKey, sS.privateKey);

        expect(decryptedText.toString(16)).toEqual(plainText);
        expect(sPrime[0]).toEqual(Sprime[0]);
        expect(sPrime[1]).toEqual(Sprime[1]);
    });
});
