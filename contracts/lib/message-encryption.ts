import crypto from 'crypto';
import {babyjub} from 'circomlibjs';
import {
    formatPrivateKeyForBabyJub,
    generatePublicKey,
    generateRandomBabyJubValue,
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
        formatPrivateKeyForBabyJub(privateKey),
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

export class SenderTransaction {
    // This value is used to be packed inside cipher text
    readonly spenderRandom: BigInt;
    // This value is used to create commitments that only user that knows `s-private` & spenderRandom can spend
    // Its equal to spenderRandom * S = S'
    readonly spenderPubKey: BigInt[];
    // This value is used to create ephemeral public Key and use this key as key to cipher text
    readonly ephemeralRandom: BigInt;
    // This value is ephemeralRandom * S - used to cipher text
    readonly ephemeralPubKey: BigInt[];
    // Packed version
    readonly ephemeralPubKeyPacked: Uint8Array;
    // This value is used to be shared in open form - ephemeralRandom * B
    // Since spender side knows 's' -> s * ephemeralRandom * B = s * B * ephemeralRandom
    readonly ephemeralSharedPubKey: BigInt[];
    // Packed version
    readonly ephemeralSharedPubKeyPacked: Uint8Array;
    // IV 16 bytes - 128 bit for encryption
    readonly iv: Uint8Array;
    // Text to be ciphered
    textToBeCiphered: Uint8Array;
    // Ciphered text
    cipheredText: Uint8Array;
    // Text to be send on-chain
    cipheredTextMessageV1: Uint8Array;

    public constructor(spenderRootPubKey) {
        this.spenderRandom = generateRandomBabyJubValue();
        this.spenderPubKey = babyjub.mulPointEscalar(
            spenderRootPubKey,
            this.spenderRandom,
        );
        // this.spenderPubKey = generatePublicKey(this.spenderRandom);
        this.ephemeralRandom = generateRandomBabyJubValue();
        this.ephemeralPubKey = generateEcdhSharedKeyPoint(
            this.ephemeralRandom,
            spenderRootPubKey,
        );
        this.ephemeralPubKeyPacked = babyjub.packPoint(this.ephemeralPubKey);
        this.ephemeralSharedPubKey = generatePublicKey(this.ephemeralRandom);
        this.ephemeralSharedPubKeyPacked = babyjub.packPoint(
            this.ephemeralSharedPubKey,
        );
        this.iv = this.ephemeralPubKeyPacked.slice(16, 32);
        this.textToBeCiphered = crypto.randomBytes(32);
        this.cipheredText = crypto.randomBytes(32);
        this.cipheredTextMessageV1 = crypto.randomBytes(64);
    }

    public encryptMessageV1() {
        // [0] - Pack random
        // Version-1: Random = 32bytes ( decrypt in place just for test )
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
            this.ephemeralPubKeyPacked.slice(0, 16),
            this.iv,
        );
        cipher.setAutoPadding(false);

        const cipheredText1 = cipher.update(this.textToBeCiphered);
        const cipheredText2 = cipher.final();
        // [2] - semi-pack
        this.cipheredText = new Uint8Array([
            ...cipheredText1,
            ...cipheredText2,
        ]);
        if (this.cipheredText.length != 32) {
            throw 'Size of ciphered text V1 must be equal to 32 bytes';
        }
    }

    public packCipheredText() {
        this.cipheredTextMessageV1 = new Uint8Array([
            ...this.ephemeralSharedPubKeyPacked,
            ...this.cipheredText,
        ]);
    }
}

export class RecipientTransaction {
    // Only spender have it
    readonly spenderRootKeys: IKeypair;
    // This pair is build using random & root private key
    spenderKeys: IKeypair;
    // Value that must be extracted from ciphered-text
    spenderRandom: BigInt;
    // Value that must be derived in order to decrypt ciphered text
    ephemeralPubKey: BigInt[];
    ephemeralPubKeyPacked: Uint8Array;
    // Value that used to reconstruct ephemeralPubKey in order to be able to decrypt
    ephemeralSharedPubKey: BigInt[];
    ephemeralSharedPubKeyPacked: Uint8Array;
    iv: Uint8Array;
    cipheredTextMessageV1: Uint8Array;
    cipheredText: Uint8Array;
    decryptedText: Uint8Array;

    constructor(spenderRootKeys: IKeypair) {
        // [0] - Real keys
        this.spenderRootKeys = spenderRootKeys;
        // [1] - Just init
        const privKey = generateRandomBabyJubValue();
        this.spenderKeys = {
            privateKey: privKey,
            publicKey: generatePublicKey(privKey),
        };
        this.spenderKeys.privateKey = generateRandomBabyJubValue();
        this.spenderKeys.publicKey = generatePublicKey(
            this.spenderKeys.privateKey,
        );
        // [2] - Random values to be on safe side
        this.spenderRandom = generateRandomBabyJubValue();
        this.ephemeralPubKey = generatePublicKey(generateRandomBabyJubValue());
        this.ephemeralPubKeyPacked = bigIntToBuffer32(
            generateRandomBabyJubValue(),
        );
        this.ephemeralSharedPubKey = generatePublicKey(
            generateRandomBabyJubValue(),
        );
        this.ephemeralSharedPubKeyPacked = bigIntToBuffer32(
            generateRandomBabyJubValue(),
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
            this.ephemeralPubKeyPacked.slice(0, 16),
            this.iv,
        );
        decipher.setAutoPadding(false);

        const decrypted1 = decipher.update(this.cipheredText);
        const decrypted2 = decipher.final();
        // [2] - semi-unpack
        this.decryptedText = new Uint8Array([...decrypted1, ...decrypted2]);
        if (this.decryptedText.length != 32) {
            throw 'decrypted text V1 must be equal to 36 bytes';
        }
    }

    public unpackMessageV1(cipheredTextMessageV1: Uint8Array) {
        // [0] - check size
        if (cipheredTextMessageV1.length != this.cipheredTextMessageV1.length) {
            throw 'CipheredTextMessageV1 must be equal to 64';
        }
        this.cipheredTextMessageV1 = cipheredTextMessageV1;
        // [1] - Keys
        this.ephemeralSharedPubKeyPacked = this.cipheredTextMessageV1.slice(
            0,
            0 + 32,
        );
        this.ephemeralSharedPubKey = babyjub.unpackPoint(
            this.ephemeralSharedPubKeyPacked,
        );
        this.ephemeralPubKey = babyjub.mulPointEscalar(
            this.ephemeralSharedPubKey,
            this.spenderRootKeys.privateKey,
        );
        this.ephemeralPubKeyPacked = babyjub.packPoint(this.ephemeralPubKey);
        // [2] - IV
        this.iv = this.ephemeralPubKeyPacked.slice(16, 32);
        // [3] - Ciphered text
        this.cipheredText = this.cipheredTextMessageV1.slice(32, 32 + 32);
    }
}
