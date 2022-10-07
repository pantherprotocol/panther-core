import crypto from 'crypto';
import {babyjub} from 'circomlibjs';
import {
    formatPrivateKeyForBabyJubModSubOrder,
    generatePublicKey,
    generateRandomBabyJubModSubOrderValue,
    multiplyScalars,
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
        formatPrivateKeyForBabyJubModSubOrder(privateKey),
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

export class UtxoSenderData {
    // This value is used to be packed inside cipher text
    readonly spenderRandom: BigInt;
    // This value is used to create commitments that only user that knows `s-private` & spenderRandom can spend
    // Its equal to spenderRandom * S = S'
    readonly spenderPubKey: BigInt[];
    // This value is used to create ephemeral public Key and use this key as key to cipher text
    readonly ephemeralRandom: BigInt;
    // This value is ephemeralRandom * S - used to cipher text
    readonly ephemeralSharedKey: BigInt[];
    // Packed version
    readonly ephemeralSharedKeyPacked: Uint8Array;
    // This value is used to be shared in open form - ephemeralRandom * B
    // Since spender side knows 's' -> s * ephemeralRandom * B = s * B * ephemeralRandom
    readonly ephemeralKey: BigInt[];
    // Packed version
    readonly ephemeralKeyPacked: Uint8Array;
    // IV 16 bytes - 128 bit for encryption
    readonly iv: Uint8Array;
    // Text to be ciphered
    textToBeCiphered: Uint8Array;
    // Ciphered text
    cipheredText: Uint8Array;
    // Text to be send on-chain
    cipheredTextMessageV1: Uint8Array;

    public constructor(spenderRootPubKey) {
        this.spenderRandom = generateRandomBabyJubModSubOrderValue();
        this.spenderPubKey = babyjub.mulPointEscalar(
            spenderRootPubKey,
            this.spenderRandom,
        );
        this.ephemeralRandom = generateRandomBabyJubModSubOrderValue();
        this.ephemeralSharedKey = generateEcdhSharedKeyPoint(
            this.ephemeralRandom,
            spenderRootPubKey,
        );
        this.ephemeralSharedKeyPacked = babyjub.packPoint(
            this.ephemeralSharedKey,
        );
        this.ephemeralKey = generatePublicKey(this.ephemeralRandom);
        this.ephemeralKeyPacked = babyjub.packPoint(this.ephemeralKey);
        this.iv = this.ephemeralSharedKeyPacked.slice(16, 32);
        this.textToBeCiphered = crypto.randomBytes(32);
        this.cipheredText = crypto.randomBytes(32);
        this.cipheredTextMessageV1 = crypto.randomBytes(64);
    }

    public encryptMessageV1() {
        // [0] - Pack random
        // Version-1: Random = 32bytes, truncated to babyJubSubGroup -> 5 leading zeros @ position MSB - index 32
        const textToBeCiphered = new Uint8Array([
            ...bigIntToBuffer32(this.spenderRandom),
        ]);
        if (textToBeCiphered.length != this.textToBeCiphered.length) {
            throw 'Size of text to be ciphered V1 must be equal to 32 bytes';
        }
        this.textToBeCiphered = textToBeCiphered;
        // [1] - cipher
        const cipher = crypto.createCipheriv(
            'aes-128-cbc',
            this.ephemeralSharedKeyPacked.slice(0, 16),
            this.iv,
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
    }
}

export class UtxoRecipientData {
    // Only spender have it
    readonly spenderRootKeys: IKeypair;
    // This pair is build using random & root private key
    spenderKeys: IKeypair;
    // Value that must be extracted from ciphered-text
    spenderRandom: BigInt;
    // Value that must be derived in order to decrypt ciphered text
    ephemeralSharedKey: BigInt[];
    ephemeralSharedKeyPacked: Uint8Array;
    // Value that used to reconstruct ephemeralPubKey in order to be able to decrypt
    ephemeralKey: BigInt[];
    ephemeralKeyPacked: Uint8Array;
    iv: Uint8Array;
    cipheredTextMessageV1: Uint8Array;
    cipheredText: Uint8Array;
    decryptedText: Uint8Array;

    constructor(spenderRootKeys: IKeypair) {
        // [0] - Real keys
        this.spenderRootKeys = spenderRootKeys;
        // [1] - Just init
        const privKey = generateRandomBabyJubModSubOrderValue();
        this.spenderKeys = {
            privateKey: privKey,
            publicKey: generatePublicKey(privKey),
        };
        this.spenderKeys.privateKey = generateRandomBabyJubModSubOrderValue();
        this.spenderKeys.publicKey = generatePublicKey(
            this.spenderKeys.privateKey,
        );
        // [2] - Random values to be on safe side
        this.spenderRandom = generateRandomBabyJubModSubOrderValue();
        this.ephemeralSharedKey = generatePublicKey(
            generateRandomBabyJubModSubOrderValue(),
        );
        this.ephemeralSharedKeyPacked = bigIntToBuffer32(
            generateRandomBabyJubModSubOrderValue(),
        );
        this.ephemeralKey = generatePublicKey(
            generateRandomBabyJubModSubOrderValue(),
        );
        this.ephemeralKeyPacked = bigIntToBuffer32(
            generateRandomBabyJubModSubOrderValue(),
        );
        this.iv = crypto.randomBytes(16);
        this.cipheredTextMessageV1 = crypto.randomBytes(64);
        this.cipheredText = crypto.randomBytes(32);
        this.decryptedText = crypto.randomBytes(32);
    }

    unpackRandom() {
        // [0] - Unpack random - from now on funds can be spent
        this.spenderRandom = buffer32ToBigInt(
            this.decryptedText.slice(0, 0 + 32),
        );
        // [1] - Make derived public & private keys
        this.spenderKeys.privateKey = multiplyScalars(
            this.spenderRootKeys.privateKey,
            this.spenderRandom,
        );
        // [2] - Set public key
        this.spenderKeys.publicKey = babyjub.mulPointEscalar(
            this.spenderRootKeys.publicKey,
            this.spenderRandom,
        );
    }

    public decryptMessageV1() {
        // [0] - decipher - if fails it will throw
        const decipher = crypto.createDecipheriv(
            'aes-128-cbc',
            this.ephemeralSharedKeyPacked.slice(0, 16),
            this.iv,
        );
        decipher.setAutoPadding(false);

        const decrypted1 = decipher.update(this.cipheredText.slice(0, 16));
        // check for semi-prolog - if it is 5 leading MSB zeros of this byte
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
        if (cipheredTextMessageV1.length != this.cipheredTextMessageV1.length) {
            throw 'CipheredTextMessageV1 must be equal to 64';
        }
        this.cipheredTextMessageV1 = cipheredTextMessageV1;
        // [1] - Keys
        this.ephemeralKeyPacked = this.cipheredTextMessageV1.slice(0, 0 + 32);
        this.ephemeralKey = babyjub.unpackPoint(this.ephemeralKeyPacked);
        this.ephemeralSharedKey = babyjub.mulPointEscalar(
            this.ephemeralKey,
            this.spenderRootKeys.privateKey,
        );
        this.ephemeralSharedKeyPacked = babyjub.packPoint(
            this.ephemeralSharedKey,
        );
        // [2] - IV
        this.iv = this.ephemeralSharedKeyPacked.slice(16, 32);
        // [3] - Ciphered text
        this.cipheredText = this.cipheredTextMessageV1.slice(32, 32 + 32);
    }
}
