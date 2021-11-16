import * as assert from 'assert';
import * as crypto from 'src/crypto';
import {babyjub, eddsa, mimc7} from 'circomlibjs';
import * as ff from 'ffjavascript';
import * as createBlakeHash from 'blake-hash';

const FIELD_SIZE = BigInt(
    '21888242871839275222246405745257275088548364400416034343698204186575808495617',
)

interface ICiphertext {
    iv: bigint;
    data: bigint[];
}

interface IKeypair {
    publicKey: bigint[];
    privateKey: bigint;
}

type PrivateKey = bigint;
type PublicKey = bigint[];
type EcdhSharedKey = bigint;
type Plaintext = BigInt[];

const deriveKeypairFromSeed = (
    seed = generateRandomBabyJubValue(),
): IKeypair => {
    const privateKey = generatePrivateKeyBabyJubJubFromSeed(seed); //
    const publicKey = generatePublicKey(privateKey);
    return {
        privateKey: privateKey,
        publicKey: publicKey,
    };
};

const generateKeypair = (): IKeypair => {
    const seed = generateRandomBabyJubValue();
    return deriveKeypairFromSeed(seed);
};

const generatePrivateKeyBabyJubJubFromSeed = (seed: bigint): PrivateKey => {
    const privateKey: PrivateKey = seed % FIELD_SIZE;
    assert(privateKey < FIELD_SIZE);
    return privateKey;
};

const generatePublicKey = (privateKey: PrivateKey): PublicKey => {
    privateKey = BigInt(privateKey.toString());
    assert(privateKey < FIELD_SIZE);
    console.log('Private key: ', {privateKey});
    return babyjub.mulPointEscalar(
        babyjub.Base8,
        formatPrivateKeyForBabyJub(privateKey),
    );
};

const generateEcdhSharedKey = (
    privateKey: PrivateKey,
    publicKey: PublicKey,
): EcdhSharedKey => {
    return babyjub.mulPointEscalar(
        publicKey,
        formatPrivateKeyForBabyJub(privateKey),
    )[0];
};

const formatPrivateKeyForBabyJub = (privateKey: PrivateKey) => {
    const sBuff = eddsa.pruneBuffer(
        createBlakeHash('blake512')
            .update(bigIntToBuffer(privateKey))
            .digest()
            .slice(0, 32),
    );
    const s = ff.utils.leBuff2int(sBuff);
    return ff.Scalar.shr(s, 3);
};

const bigIntToBuffer = (i: BigInt): Buffer => {
    let hexStr = i.toString(16);
    while (hexStr.length < 64) {
        hexStr = '0' + hexStr;
    }
    return Buffer.from(hexStr, 'hex');
};

const generateRandomBabyJubValue = (): bigint => {
    const random = generateRandomness();
    const privateKey: PrivateKey = random % FIELD_SIZE;
    assert(privateKey < FIELD_SIZE);
    return privateKey;
};

// const hashPoseidon = (seed: string): string => {
//     const hash = '';
//     // TODO: any string converted to 32 byte hash -> SHA256 or Poseidon
//     return hash;
// };

const generateRandomness = (): bigint => {
    const min = BigInt(
        '6350874878119819312338956282401532410528162663560392320966563075034087161851',
    );
    let randomness;
    while (true) {
        randomness = BigInt('0x' + crypto.randomBytes(32).toString('hex'));
        if (randomness >= min) {
            break;
        }
    }
    return randomness;
};

const encryptMessage = (
    plaintext: Plaintext,
    sharedKey: EcdhSharedKey,
): ICiphertext => {
    const iv = mimc7.multiHash(plaintext, BigInt(0));

    const ciphertext: ICiphertext = {
        iv,
        data: plaintext.map((e: BigInt, i: number): bigint => {
            return e + mimc7.hash(sharedKey, iv + BigInt(i));
        }),
    };
    return ciphertext;
};

const decryptMessage = (
    ciphertext: ICiphertext,
    sharedKey: EcdhSharedKey,
): Plaintext => {
    return ciphertext.data.map((e: bigint, i: number): BigInt => {
        return (
            BigInt(e) -
            BigInt(mimc7.hash(sharedKey, BigInt(ciphertext.iv) + BigInt(i)))
        );
    });
};

export {
    deriveKeypairFromSeed,
    encryptMessage,
    decryptMessage,
    generateKeypair,
    generateEcdhSharedKey,
    PrivateKey,
    PublicKey,
    EcdhSharedKey,
    Plaintext,
};
