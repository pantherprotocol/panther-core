// should have few more classes for keypair,
// differentiate between master keypair and derived
// rootkeypair, keypair and derived keypair

export interface IKeypair {
    publicKey: bigint[];
    privateKey: bigint;
}
export type PrivateKey = bigint;
export type PublicKey = bigint[];
export type EcdhSharedKey = bigint;
