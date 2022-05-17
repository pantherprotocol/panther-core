import crypto from 'crypto';

import { babyjub } from 'circomlibjs';
import { utils } from 'ethers';

import { bigintToBytes32 } from './conversions';
import { formatPrivateKeyForBabyJub, generatePublicKey, generateRandomBabyJubValue } from './keychain';
import { ICiphertext } from './types/message';
import { PrivateKey, PublicKey, EcdhSharedKey, EcdhSharedKeyPoint, IKeypair } from './types/keypair';
import { Buffer } from 'buffer';

export const generateEcdhSharedKey = (
    privateKey: PrivateKey,
    publicKey: PublicKey,
): EcdhSharedKey => {
    return babyjub.mulPointEscalar(
        publicKey,
        formatPrivateKeyForBabyJub(privateKey),
    )[0];
};

export const generateEcdhSharedKeyPoint = (
    privateKey: PrivateKey,
    publicKey: PublicKey,
): EcdhSharedKeyPoint => {
    return babyjub.mulPointEscalar(
        publicKey,
        formatPrivateKeyForBabyJub(privateKey),
    );
};

export function encryptMessage(
    plaintext: string,
    sharedKey: EcdhSharedKey,
): ICiphertext {
    const iv = crypto.randomBytes(16);

    try {
        const cipher = crypto.createCipheriv(
            'aes-256-cbc',
            utils.arrayify(bigintToBytes32(sharedKey as bigint)),
            iv,
        );
        return {
            iv: iv.toString('hex'),
            data: cipher.update(plaintext, 'utf8', 'hex') + cipher.final('hex'),
        };
    } catch (error) {
        throw Error(`Failed to encrypt message: ${error}`);
    }
}

export function decryptMessage(
    ciphertext: ICiphertext,
    sharedKey: EcdhSharedKey,
): string {
    const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        utils.arrayify(bigintToBytes32(sharedKey as bigint)),
        Buffer.from(ciphertext.iv, 'hex'),
    );

    return (
        decipher.update(ciphertext.data, 'hex', 'utf8') + decipher.final('utf8')
    );
}

// TODO: move it to utils or lib since its related to pack-unpack operation
export function bigIntToBuffer32(bn) {
    // The handy-dandy `toString(base)` works!!
    let hex = BigInt(bn).toString(16);

    // But it still follows the old behavior of giving
    // invalid hex strings (due to missing padding),
    // but we can easily add that back
    if (hex.length % 2) { hex = '0' + hex; }

    // The byteLength will be half of the hex string length
    let len = hex.length / 2;
    let u8 = new Uint8Array(32); //len);

    // And then we can iterate each element by one
    // and each hex segment by two
    let i = 0;
    let j = 0;
    while (i < len) {
        u8[i] = parseInt(hex.slice(j, j+2), 16);
        i += 1;
        j += 2;
    }
    // zeros - since we want 32 bytes
    while ( i < 32 ) {
        u8[i] = parseInt(BigInt(0).toString(16).slice(0, 2), 16);
        i += 1;
    }
    return u8;
}

// TODO: move it to utils or lib since its related to pack-unpack operation
export function buffer32ToBigInt(buf) {
    let hex : string[] = [];
    let u8 = Uint8Array.from(buf);

    u8.forEach(function (i) {
        let h = i.toString(16);
        if (h.length % 2) { h = '0' + h; }
        hex.push(h);
    });

    return BigInt('0x' + hex.join(''));
}

export class SenderTransaction {
    // This value is used to be packed inside cipher text
    readonly spenderRandom : BigInt;
    // This value is used to create commitments that only user that knows `s-private` & spenderRandom can spend
    // Its equal to spenderRandom * S = S'
    readonly spenderPubKey : BigInt[];
    // This value is used to create ephemeral public Key and use this key as key to cipher text
    readonly ephemeralRandom : BigInt;
    // This value is ephemeralRandom * S - used to cipher text
    readonly ephemeralPubKey : BigInt[];
    // Packed version
    readonly ephemeralPubKeyPacked : Buffer;
    // This value is used to be shared in open form - ephemeralRandom * B
    // Since spender side knows 's' -> s * ephemeralRandom * B = s * B * ephemeralRandom
    readonly ephemeralSharedPubKey : BigInt[];
    // Packed version
    readonly ephemeralSharedPubKeyPacked : Buffer;
    // IV 16 bytes - 128 bit for encryption
    readonly iv : Buffer;
    // Text to be ciphered
    cipheredText : Uint8Array;
    // Text to be send on-chain
    cipheredTextMessageV1 : Uint8Array;

    public constructor (spenderRootPubKey) {
        this.spenderRandom = generateRandomBabyJubValue();
        this.spenderPubKey = generatePublicKey(this.spenderRandom);
        this.ephemeralRandom = generateRandomBabyJubValue();
        this.ephemeralPubKey = generateEcdhSharedKeyPoint(this.ephemeralRandom,spenderRootPubKey);
        this.ephemeralPubKeyPacked = babyjub.packPoint(this.ephemeralPubKey);
        this.ephemeralSharedPubKey = generatePublicKey(this.ephemeralRandom);
        this.ephemeralSharedPubKeyPacked = babyjub.packPoint(this.ephemeralSharedPubKey);
        this.iv = crypto.randomBytes(16);
        this.cipheredText = crypto.randomBytes(48);
        this.cipheredTextMessageV1 = crypto.randomBytes(96);
    }

    public encryptMessageV1() {
        // [0] - Pack prolog & random
        // Version-1: Prolog,Random = 4bytes, 32bytes ( decrypt in place just for test )
        const prolog = 0xEEFFEEFF; // THIS prolog must be used as is, according to specs
        const textToBeCiphered = new Uint8Array( [...bigIntToBuffer32(prolog).slice(0,4), ...(bigIntToBuffer32(this.spenderRandom))]);
        if ( textToBeCiphered.length != 36 ) {
            throw "Size of text to be ciphered V1 must be equal to 36 bytes";
        }
        // [1] - cipher
        // const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(
            'aes-256-cbc',
            this.ephemeralPubKeyPacked,
            this.iv
        );
        const cipheredText1 = cipher.update(textToBeCiphered);
        const cipheredText2 = cipher.final();
        // [2] - semi-pack
        this.cipheredText = new Uint8Array([...cipheredText1,...cipheredText2]);
        if ( this.cipheredText.length != 48 ) {
            throw "Size of ciphered text V1 must be equal to 48 bytes";
        }
    }

    public packCipheredText() {
        this.cipheredTextMessageV1 = new Uint8Array([...this.iv, ...this.ephemeralSharedPubKeyPacked, ...this.cipheredText]);
    }

};

export class RecipientTransaction {
    // Only spender have it
    readonly spenderRootKeys : IKeypair;
    // Value that must be extracted from ciphered-text
    spenderRandom : BigInt;
    // Value that must be derived from random & root priv-key in order to be able to spend
    spenderPubKey : BigInt[];
    // Value that must be derived in order to decrypt ciphered text
    ephemeralPubKey : BigInt[];
    ephemeralPubKeyPacked : Uint8Array;
    // Value that used to reconstruct ephemeralPubKey in order to be able to decrypt
    ephemeralSharedPubKey : BigInt[];
    ephemeralSharedPubKeyPacked : Uint8Array;
    iv : Uint8Array;
    cipheredTextMessageV1 : Uint8Array;
    cipheredText : Uint8Array;
    decryptedText: Uint8Array;

    constructor(spenderRootKeys : IKeypair) {
        // [0] - Real keys
        this.spenderRootKeys = spenderRootKeys;
        // [1] - Random values to be on safe side
        this.spenderRandom = generateRandomBabyJubValue();
        this.spenderPubKey = generatePublicKey(generateRandomBabyJubValue());
        this.ephemeralPubKey = generatePublicKey(generateRandomBabyJubValue());
        this.ephemeralPubKeyPacked = bigIntToBuffer32(generateRandomBabyJubValue());
        this.ephemeralSharedPubKey = generatePublicKey(generateRandomBabyJubValue());
        this.ephemeralSharedPubKeyPacked = bigIntToBuffer32(generateRandomBabyJubValue());
        this.iv = crypto.randomBytes(16);
        this.cipheredTextMessageV1 = crypto.randomBytes(96);
        this.cipheredText = crypto.randomBytes(48);
        this.decryptedText = crypto.randomBytes(32);
    }

    unpackRandomAndCheckProlog() {
        // [0] - Prolog check
        const prolog = BigInt(0xEEFFEEFF);
        const prolog_from_chain = buffer32ToBigInt(this.decryptedText.slice(0,0+4));
        if( prolog_from_chain != prolog ) {
            throw "Prolog V1 is not equal";
        }
        // [1] - Unpack random - from now on funds can be spent
        this.spenderRandom = buffer32ToBigInt(this.decryptedText.slice(4,4+32));
    }

    public decryptMessageV1() {
        // [0] - decipher - if fails it will throw
        const decipher = crypto.createDecipheriv(
            'aes-256-cbc',
            this.ephemeralPubKeyPacked,
            this.iv
        );
        const decrypted1 = decipher.update(this.cipheredText);
        const decrypted2 = decipher.final();
        // [2] - semi-unpack
        this.decryptedText = new Uint8Array([...decrypted1,...decrypted2]);
        if ( this.decryptedText.length != 36 ) {
            throw "decrypted text V1 must be equal to 36 bytes";
        }
    }

    public unpackMessageV1(cipheredTextMessageV1 : Uint8Array) {
        // [0] - check size
        if(cipheredTextMessageV1.length != this.cipheredTextMessageV1.length) {
            throw "CipheredTextMessageV1 must be equal to 96";
        }
        this.cipheredTextMessageV1 = cipheredTextMessageV1;
        // [1] - IV
        this.iv = this.cipheredTextMessageV1.slice(0,0+16);
        // [2] - Keys
        this.ephemeralSharedPubKeyPacked = this.cipheredTextMessageV1.slice(16,16+32);
        this.ephemeralSharedPubKey = babyjub.unpackPoint(this.ephemeralSharedPubKeyPacked);
        this.ephemeralPubKey = babyjub.mulPointEscalar(this.ephemeralSharedPubKey,this.spenderRootKeys.privateKey);
        this.ephemeralPubKeyPacked = babyjub.packPoint(this.ephemeralPubKey);
        // [3] - Ciphered text
        this.cipheredText = this.cipheredTextMessageV1.slice(48,48+48);
    }
};

