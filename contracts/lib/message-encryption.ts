import crypto from 'crypto';
import {babyjub} from 'circomlibjs';
import {
    moduloBabyJubSubFieldPrime,
    derivePublicKeyFromPrivate,
    generateRandomInBabyJubSubField,
    deriveChildPrivKeyFromRootPrivKey,
    deriveChildPubKeyFromRootPubKey,
} from './keychain';
import {
    PrivateKey,
    PublicKey,
    EcdhSharedKeyPoint,
    IKeypair,
} from './types/keypair';
import {bigintToBuf, bufToBigint} from 'bigint-conversion';

export const generateEcdhSharedKeyPoint = (
    privateKey: PrivateKey,
    publicKey: PublicKey,
): EcdhSharedKeyPoint => {
    return babyjub.mulPointEscalar(
        publicKey,
        moduloBabyJubSubFieldPrime(privateKey),
    );
};

// TODO: move it to utils or lib since its related to pack-unpack operation
export function bigIntToBuffer32(bn) {
    let result = new Uint8Array(bigintToBuf(bn));
    if (result.length < 32) {
        const padding = new Uint8Array(32 - result.length);
        padding.fill(
            parseInt(BigInt(0).toString(16).slice(0, 2), 16),
            padding.length,
        );

        //result = new Uint8Array([...result,...padding]);
        result = new Uint8Array([...padding, ...result]);
    }
    if (result.length > 32) {
        throw 'Support only number convertable to 32 bytes';
    }
    // TODO: remove double check in production
    if (buffer32ToBigInt(result) != bn) {
        console.log('BN.STR:', bn.toString(16), ', RESULT: ', result);
        result.forEach(function (i) {
            let h = i.toString(16);
            if (h.length % 2) {
                h = '0' + h;
            }
            console.log('RESULT_HEX[', i, ']: ', h);
        });
    }
    return result;
}

// TODO: move it to utils or lib since its related to pack-unpack operation
export function buffer32ToBigInt(buf) {
    return bufToBigint(buf);
}

// Usage flow of this class:
// 1. Constructor
// 2. encryptMessageV1
// 3. packCipheredTextV1
export class UtxoSenderData {
    // Random to derive the (child) spending keypair with, included in the text to be ciphered
    readonly recipientRandom: BigInt;
    // (Child) spending public key, used to create the UTXO commitment
    // S` = spenderRandom * S, where S is recipientRootPubKey
    readonly recipientPubKey: BigInt[];
    // Random to derive ephemeral shared key with
    readonly ephemeralRandom: BigInt;
    // EC point to pack it into ephemeralSharedKeyPacked, equals to 'ephemeralRandom * W',
    // where W is the reading public key of the recipient
    // (recipient may compute it as 'w * ephemeralKey = ephemeralRandom * w * B')
    readonly ephemeralSharedKey: BigInt[];
    // Packed version of ephemeralSharedKey, aes128EncryptionKey and aes128Iv extracted from it
    readonly ephemeralSharedKeyPacked: Uint8Array;
    // EC point to derive ephemeralSharedKey from, equals to 'ephemeralRandom * B';
    // (knowing it and 'w', recipient may compute 'ephemeralSharedKey = w * ephemeralKey')
    readonly ephemeralKey: BigInt[];
    // Packed version of ephemeralKey, it's shared with spender in open form
    readonly ephemeralKeyPacked: Uint8Array;
    // Key used in AES-128-cbc, extracted from ephemeralKeyPacked
    readonly aes128EncryptionKey: Uint8Array;
    // IV  (128 bits) used in AES-128-cbc, extracted from ephemeralKeyPacked
    readonly aes128Iv: Uint8Array;
    // Text to be ciphered
    textToBeCiphered: Uint8Array;
    // Ciphered text
    cipheredText: Uint8Array;
    // Message (of type 1, with ephemeralKeyPacked and ciphertext) to be sent on-chain
    cipheredTextMessageV1: Uint8Array;

    public constructor(
        recipientRootPubKey: PublicKey,
        recipientReadingPubKey: PublicKey,
    ) {
        this.recipientRandom = generateRandomInBabyJubSubField();
        this.recipientPubKey = deriveChildPubKeyFromRootPubKey(
            recipientRootPubKey,
            this.recipientRandom,
        );
        this.ephemeralRandom = generateRandomInBabyJubSubField();
        this.ephemeralSharedKey = generateEcdhSharedKeyPoint(
            this.ephemeralRandom,
            recipientReadingPubKey,
        );
        this.ephemeralSharedKeyPacked = babyjub.packPoint(
            this.ephemeralSharedKey,
        );
        this.ephemeralKey = derivePublicKeyFromPrivate(this.ephemeralRandom);
        this.ephemeralKeyPacked = babyjub.packPoint(this.ephemeralKey);
        // this.ephemeralSharedKeyPacked[0] is the LSByte of this.ephemeralSharedKey[1], and
        // this.ephemeralSharedKeyPacked[31] is the modified (in the MSBit) MSByte of this.ephemeralSharedKey[1]
        this.aes128EncryptionKey = this.ephemeralSharedKeyPacked.slice(0, 16);
        this.aes128Iv = this.ephemeralSharedKeyPacked.slice(16, 32);
    }

    public encryptMessageV1() {
        // [0] - Pack random
        // Version-1: Random = 32bytes, modulo babyjub.subOrder -> 5 leading zeros @ position MSB - index 32
        const textToBeCiphered = new Uint8Array([
            ...bigIntToBuffer32(this.recipientRandom),
        ]);
        if (textToBeCiphered.length != 32) {
            throw 'Size of text to be ciphered V1 must be equal to 32 bytes';
        }
        this.textToBeCiphered = textToBeCiphered;
        // [1] - cipher
        const cipher = crypto.createCipheriv(
            'aes-128-cbc',
            this.aes128EncryptionKey,
            this.aes128Iv,
        );
        cipher.setAutoPadding(false);

        // zero index is MSB byte of big-int random, and since it has 5 leading zeros because of BabyJub-SubGroup mod
        // decrypting side will decrypt first chunk & check for 5 leading zeros, if not exists -> message is not for us
        // Commented code is explicit version - here for reference
        //const cipheredText1 = cipher.update(this.textToBeCiphered.slice(0,16));
        //const cipheredText2 = cipher.update(this.textToBeCiphered.slice(16,32));
        //cipher.final();
        const cipheredText1 = cipher.update(this.textToBeCiphered);
        const cipheredText2 = cipher.final();
        // [2] - semi-pack
        this.cipheredText = new Uint8Array([
            ...cipheredText1,
            ...cipheredText2,
        ]);
        if (this.cipheredText.length != 32) {
            throw (
                'Size of ciphered text V1 must be equal to 32 bytes, but it is equal to:' +
                this.cipheredText.length
            );
        }
    }

    public packCipheredText() {
        this.cipheredTextMessageV1 = new Uint8Array([
            ...this.ephemeralKeyPacked,
            ...this.cipheredText,
        ]);
        if (this.cipheredTextMessageV1.length != 64) {
            throw (
                'Size of ciphered text message V1 must be equal to 64 bytes, 32 byte for packed-key, and 32 bytes for encrypted random, but it is equal to:' +
                this.cipheredTextMessageV1.length
            );
        }
    }
}
// Usage flow of this class:
// 1. Constructor
// 2. unpackMessageV1
// 3. decryptMessageV1
// 4. deriveRecipientSpendingKeysFromRootKeysAndRandom
export class UtxoRecipientData {
    // Only spender have it
    readonly recipientReadingKeys: IKeypair;
    // This pair is build using random & root private key
    recipientSpendingKeys: IKeypair;
    // Value that must be extracted from ciphered-text
    recipientRandom: BigInt;
    // Value that must be derived in order to decrypt ciphered text
    ephemeralSharedKey: BigInt[];
    ephemeralSharedKeyPacked: Uint8Array;
    // Value that used to reconstruct ephemeralPubKey in order to be able to decrypt
    ephemeralKey: BigInt[];
    ephemeralKeyPacked: Uint8Array;
    aes128EncryptionKey: Uint8Array;
    aes128Iv: Uint8Array;
    cipheredTextMessageV1: Uint8Array;
    cipheredText: Uint8Array;
    decryptedText: Uint8Array;

    constructor(recipientReadingKeys: IKeypair) {
        // [0] - Real keys
        this.recipientReadingKeys = recipientReadingKeys;
    }

    public deriveRecipientSpendingKeysFromRootKeysAndRandom(
        recipientRootKeys: IKeypair,
    ) {
        // [0] - Unpack random - from now on funds can be spent
        this.recipientRandom = buffer32ToBigInt(
            this.decryptedText.slice(0, 0 + 32),
        );
        // [1] - Make derived public & private keys
        this.recipientSpendingKeys = {
            publicKey: babyjub.mulPointEscalar(
                recipientRootKeys.publicKey,
                this.recipientRandom,
            ),
            privateKey: deriveChildPrivKeyFromRootPrivKey(
                recipientRootKeys.privateKey,
                this.recipientRandom,
            ),
        };
    }

    // NOTE: if this function throws after `prolog` check --- it is 100% mean that this message is not for us
    // BUT, if this function succeeds, it `can be` for us, but it is not 100%, and user of this class must do
    // additional check during UTXO commitment regeneration.
    public decryptMessageV1() {
        // [0] - decipher - if fails it will throw
        const decipher = crypto.createDecipheriv(
            'aes-128-cbc',
            this.aes128EncryptionKey,
            this.aes128Iv,
        );
        decipher.setAutoPadding(false);

        const decrypted1 = decipher.update(this.cipheredText.slice(0, 16));
        // check for semi-prolog - if it is 5 leading MSB zeros of this byte - since it is mod(babyJub.SubOrder)
        if ((decrypted1[0] & 0xf8) != 0x00) {
            throw 'This message is not for us';
        }
        const decrypted2 = decipher.update(this.cipheredText.slice(16, 32));
        decipher.final();
        // [2] - semi-unpack
        this.decryptedText = new Uint8Array([...decrypted1, ...decrypted2]);
        if (this.decryptedText.length != 32) {
            throw 'decrypted text V1 must be equal to 32 bytes';
        }
    }

    public unpackMessageV1(cipheredTextMessageV1: Uint8Array) {
        // [0] - check size
        if (cipheredTextMessageV1.length != 64) {
            throw 'CipheredTextMessageV1 must be equal to 64';
        }
        this.cipheredTextMessageV1 = cipheredTextMessageV1;
        // [1] - Keys
        this.ephemeralKeyPacked = this.cipheredTextMessageV1.slice(0, 0 + 32);
        this.ephemeralKey = babyjub.unpackPoint(this.ephemeralKeyPacked);
        this.ephemeralSharedKey = babyjub.mulPointEscalar(
            this.ephemeralKey,
            this.recipientReadingKeys.privateKey,
        );
        this.ephemeralSharedKeyPacked = babyjub.packPoint(
            this.ephemeralSharedKey,
        );
        // [2] - EncryptionKey & IV
        this.aes128EncryptionKey = this.ephemeralSharedKeyPacked.slice(0, 16);
        this.aes128Iv = this.ephemeralSharedKeyPacked.slice(16, 32);
        // [3] - Ciphered text
        this.cipheredText = this.cipheredTextMessageV1.slice(32, 32 + 32);
    }
}
