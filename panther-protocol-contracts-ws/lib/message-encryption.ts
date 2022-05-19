import crypto from 'crypto';

import { babyjub } from 'circomlibjs';
import { utils } from 'ethers';

import { bigintToBytes32 } from './conversions';
import {
    deriveKeypairFromSeed,
    formatPrivateKeyForBabyJub,
    generatePublicKey,
    generateRandomBabyJubValue,
} from './keychain';
import { ICiphertext } from './types/message';
import {
    PrivateKey,
    PublicKey,
    EcdhSharedKey,
    EcdhSharedKeyPoint,
    IKeypair,
} from './types/keypair';
import { Buffer } from 'buffer';
import { bigintToBuf, bufToBigint } from 'bigint-conversion';

export function checkFn () {
    /*
    const problem = BigInt('11190577749905809504636919289551466950952332938163259116311353890251349953659');
    let decryptedText = new Uint8Array([
        0,   0,   0,   0,  24, 189, 164, 126,  50,
        108,  65,  27, 204, 124, 120,  12, 140, 149,
        15, 114, 214, 205, 154, 234,  18, 130,  27,
        111,  72,  29, 170,  48,  87,  44,  12, 123
    ]);
    let prolog = decryptedText.slice(0,4);
    let random = decryptedText.slice(4,32);
    let randomNum = buffer32ToBigInt(random);
    console.log("problem:", problem);
    console.log("prolog:", buffer32ToBigInt(prolog).toString(16), ", random:", random, ", randomNum:", randomNum);
     */

    /*
    const problem = BigInt('205857679485997401266894896096206301610488189411092784848385341199049004619');
    console.log(
        'Double convert:',
        buffer32ToBigInt(bigIntToBuffer32(205857679485997401266894896096206301610488189411092784848385341199049004619n)),
    );

    let result = new Uint8Array(bigintToBuf(problem));
    if( result.length < 32 ) {
        console.log("Padding....");
        let padding = new Uint8Array(32-result.length);
        padding.fill(parseInt(BigInt(0).toString(16).slice(0, 2), 16),padding.length);

        //result = new Uint8Array([...result,...padding]);
        result = new Uint8Array([...padding,...result]);
    }
    if ( result.length > 32 ) {
        throw "Support only number convertable to 32 bytes";
    }
    console.log('Initial value:', 205857679485997401266894896096206301610488189411092784848385341199049004619n);
    console.log("AAAA:", problem.toString(16), ", BBBB: ", result);
    result.forEach(function (i) {
        let h = i.toString(16);
        if (h.length % 2) {
            h = '0' + h;
        }
        console.log("CCCC:", h);
    });
     */
}

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
    let result = new Uint8Array(bigintToBuf(bn));
    if( result.length < 32 ) {
        let padding = new Uint8Array(32-result.length);
        padding.fill(parseInt(BigInt(0).toString(16).slice(0, 2), 16),padding.length);

        //result = new Uint8Array([...result,...padding]);
        result = new Uint8Array([...padding,...result]);
    }
    if ( result.length > 32 ) {
        throw "Support only number convertable to 32 bytes";
    }
    // TODO: remove double check in production
    if(buffer32ToBigInt(result) != bn) {
        console.log("BN.STR:", bn.toString(16), ", RESULT: ", result);
        result.forEach(function (i) {
            let h = i.toString(16);
            if (h.length % 2) {
                h = '0' + h;
            }
            console.log("RESULT_HEX[",i ,"]: ", h);
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
        this.spenderPubKey = generatePublicKey(this.spenderRandom);
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
        this.iv = crypto.randomBytes(16);
        this.textToBeCiphered = crypto.randomBytes(36);
        this.cipheredText = crypto.randomBytes(48);
        this.cipheredTextMessageV1 = crypto.randomBytes(96);
    }

    public encryptMessageV1() {
        // [0] - Pack prolog & random
        // Version-1: Prolog,Random = 4bytes, 32bytes ( decrypt in place just for test )
        const prolog = 0xeeffeeff; // THIS prolog must be used as is, according to specs
        const textToBeCiphered = new Uint8Array([
            ...bigIntToBuffer32(prolog).slice(32-4, 32),
            ...bigIntToBuffer32(this.spenderRandom),
        ]);
        if (textToBeCiphered.length != this.textToBeCiphered.length ) {
            throw 'Size of text to be ciphered V1 must be equal to 36 bytes';
        }
        this.textToBeCiphered = textToBeCiphered;
        // [1] - cipher
        // const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(
            'aes-256-cbc',
            this.ephemeralPubKeyPacked,
            this.iv,
        );
        const cipheredText1 = cipher.update(this.textToBeCiphered);
        const cipheredText2 = cipher.final();
        // [2] - semi-pack
        this.cipheredText = new Uint8Array([
            ...cipheredText1,
            ...cipheredText2,
        ]);
        if (this.cipheredText.length != 48) {
            throw 'Size of ciphered text V1 must be equal to 48 bytes';
        }
    }

    public packCipheredText() {
        this.cipheredTextMessageV1 = new Uint8Array([
            ...this.iv,
            ...this.ephemeralSharedPubKeyPacked,
            ...this.cipheredText,
        ]);
    }
}

export class RecipientTransaction {
    // Only spender have it
    readonly spenderRootKeys: IKeypair;
    // Value that must be extracted from ciphered-text
    spenderRandom: BigInt;
    // Value that must be derived from random & root priv-key in order to be able to spend
    spenderPubKey: BigInt[];
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
        // [1] - Random values to be on safe side
        this.spenderRandom = generateRandomBabyJubValue();
        this.spenderPubKey = generatePublicKey(generateRandomBabyJubValue());
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
        this.cipheredTextMessageV1 = crypto.randomBytes(96);
        this.cipheredText = crypto.randomBytes(48);
        this.decryptedText = crypto.randomBytes(32);
    }

    unpackRandomAndCheckProlog() {
        // [0] - Prolog check
        const prolog = BigInt(0xeeffeeff);
        const prolog_from_chain = buffer32ToBigInt(
            this.decryptedText.slice(0, 0 + 4),
        );
        if (prolog_from_chain != prolog) {
            throw 'Prolog V1 is not equal';
        }
        // [1] - Unpack random - from now on funds can be spent
        this.spenderRandom = buffer32ToBigInt(
            this.decryptedText.slice(4, 4 + 32),
        );
    }

    public decryptMessageV1() {
        // [0] - decipher - if fails it will throw
        const decipher = crypto.createDecipheriv(
            'aes-256-cbc',
            this.ephemeralPubKeyPacked,
            this.iv,
        );
        const decrypted1 = decipher.update(this.cipheredText);
        const decrypted2 = decipher.final();
        // [2] - semi-unpack
        this.decryptedText = new Uint8Array([...decrypted1, ...decrypted2]);
        if (this.decryptedText.length != 36) {
            throw 'decrypted text V1 must be equal to 36 bytes';
        }
    }

    public unpackMessageV1(cipheredTextMessageV1: Uint8Array) {
        // [0] - check size
        if (cipheredTextMessageV1.length != this.cipheredTextMessageV1.length) {
            throw 'CipheredTextMessageV1 must be equal to 96';
        }
        this.cipheredTextMessageV1 = cipheredTextMessageV1;
        // [1] - IV
        this.iv = this.cipheredTextMessageV1.slice(0, 0 + 16);
        // [2] - Keys
        this.ephemeralSharedPubKeyPacked = this.cipheredTextMessageV1.slice(
            16,
            16 + 32,
        );
        this.ephemeralSharedPubKey = babyjub.unpackPoint(
            this.ephemeralSharedPubKeyPacked,
        );
        this.ephemeralPubKey = babyjub.mulPointEscalar(
            this.ephemeralSharedPubKey,
            this.spenderRootKeys.privateKey,
        );
        this.ephemeralPubKeyPacked = babyjub.packPoint(this.ephemeralPubKey);
        // [3] - Ciphered text
        this.cipheredText = this.cipheredTextMessageV1.slice(48, 48 + 48);
    }
}

export class SenderRecipientSimulator {
    public recipient: RecipientTransaction;
    public sender: SenderTransaction;

    constructor(spenderSeed?: BigInt, rootKeyPair?: IKeypair) {
        this.recipient = new RecipientTransaction(
            rootKeyPair ??
                deriveKeypairFromSeed(spenderSeed ?? BigInt('0xAABBCCDDEEFF')),
        );
        this.sender = new SenderTransaction(
            this.recipient.spenderRootKeys.publicKey,
        );
    }

    // After this step we can use this.sender.cipherTextMessageV1 to be sent on-chain
    public executeCryptographySimulation() {
        this.sender.encryptMessageV1();
        this.sender.packCipheredText();
        this.recipient.unpackMessageV1(this.sender.cipheredTextMessageV1);
        this.recipient.decryptMessageV1();
        this.recipient.unpackRandomAndCheckProlog();
        if (this.recipient.spenderRandom != this.sender.spenderRandom) {
            throw 'Sent random is equal to received random';
        }
    }
    // After this step commitments & secrets can be plugged-in to generateDeposits
    public executeCommitmentCreationAndPacking() {}
}
