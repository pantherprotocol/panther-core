// should have few more classes for keypair,
// differentiate between master keypair and derived
// rootkeypair, keypair and derived keypair

export interface IKeypair {
    publicKey: BigInt[];
    privateKey: BigInt;
}
export type PrivateKey = BigInt;
export type PublicKey = BigInt[];
export type EcdhSharedKey = BigInt;
export type EcdhSharedKeyPoint = BigInt[];
