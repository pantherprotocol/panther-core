import {babyjub} from 'circomlibjs';
import {
    derivePublicKeyFromPrivate,
    generateRandomInBabyJubSubField,
    deriveChildPubKeyFromRootPubKey,
} from '@panther-core/crypto/lib/keychain';
import {deriveSpendingChildKeypair} from '@panther-core/crypto/lib/sdk/keychain';
import {PublicKey, IKeypair} from '@panther-core/crypto/lib/types/keypair';

import {generateEcdhSharedKey} from '@panther-core/crypto/lib/message-encryption';

import {
    encryptRandomSecret,
    decryptRandomSecret,
} from '@panther-core/crypto/lib/sdk/message-encryption';

import {
    bigIntToUint8Array,
    uint8ArrayToBigInt,
} from '@panther-core/crypto/lib/bigint-conversions';

// Usage flow of this class:
// 1. Constructor
// 2. encryptMessageV1
// 3. packCipheredTextV1
export class UtxoSenderData {
    readonly recipientReadingPubKey: bigint[];
    // Random to derive the (child) spending keypair with, included in the text to be ciphered
    readonly recipientRandom: bigint;
    // (Child) spending public key, used to create the UTXO commitment
    // S` = spenderRandom * S, where S is recipientRootPubKey
    readonly recipientPubKey: bigint[];
    // Random to derive ephemeral shared key with
    readonly ephemeralRandom: bigint;
    // EC point to pack it into ephemeralSharedKeyPacked, equals to 'ephemeralRandom * W',
    // where W is the reading public key of the recipient
    // (recipient may compute it as 'w * ephemeralKey = ephemeralRandom * w * B')
    readonly ephemeralSharedKey: bigint[];
    // Packed version of ephemeralSharedKey, aes128EncryptionKey and aes128Iv extracted from it
    readonly ephemeralSharedKeyPacked: Uint8Array;
    // EC point to derive ephemeralSharedKey from, equals to 'ephemeralRandom * B';
    // (knowing it and 'w', recipient may compute 'ephemeralSharedKey = w * ephemeralKey')
    readonly ephemeralKey: bigint[];
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
        this.recipientReadingPubKey = recipientReadingPubKey;
        this.recipientRandom = generateRandomInBabyJubSubField();
        this.recipientPubKey = deriveChildPubKeyFromRootPubKey(
            recipientRootPubKey,
            this.recipientRandom,
        );
        this.ephemeralRandom = generateRandomInBabyJubSubField();
        this.ephemeralSharedKey = generateEcdhSharedKey(
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
        this.cipheredTextMessageV1 = Buffer.from(
            encryptRandomSecret(
                this.recipientRandom,
                this.recipientReadingPubKey,
            ),
            'hex',
        );
    }

    public packCipheredText() {
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
    recipientRandom: bigint;
    // Value that must be derived in order to decrypt ciphered text
    ephemeralSharedKey: bigint[];
    ephemeralSharedKeyPacked: Uint8Array;
    // Value that used to reconstruct ephemeralPubKey in order to be able to decrypt
    ephemeralKey: bigint[];
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
        this.recipientRandom = uint8ArrayToBigInt(
            this.decryptedText.slice(0, 0 + 32),
        );
        // [1] - Make derived public & private keys
        this.recipientSpendingKeys = deriveSpendingChildKeypair(
            recipientRootKeys,
            this.recipientRandom,
        )[0];
    }

    // NOTE: if this function throws after `prolog` check --- it is 100% mean that this message is not for us
    // BUT, if this function succeeds, it `can be` for us, but it is not 100%, and user of this class must do
    // additional check during UTXO commitment regeneration.
    public decryptMessageV1() {
        this.decryptedText = bigIntToUint8Array(
            decryptRandomSecret(
                Buffer.from(this.cipheredTextMessageV1).toString('hex'),
                this.recipientReadingKeys.privateKey,
            ),
        );

        if ((this.decryptedText[0] & 0xf8) != 0x00) {
            throw 'This message is not for us';
        }

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
    }
}
