// should have few more classes for keypair,
// differentiate between master keypair and derived
// rootkeypair, keypair and derived keypair

export type EcdhSharedKey = bigint[];
export type PackedEcdhSharedKey = Uint8Array;

export type PrivateKey = bigint;
export type PublicKeyX = bigint;
export type PublicKeyY = bigint;
export type PublicKey = bigint[];

export interface IKeypair {
    publicKey: PublicKey;
    privateKey: PrivateKey;
}
