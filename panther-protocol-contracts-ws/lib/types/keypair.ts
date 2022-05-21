export type PrivateKey = BigInt;
export type PublicKey = [BigInt, BigInt];

export type EcdhSharedKey = bigint;
export type EcdhSharedKeyPoint = [any, any];

export interface IKeypair {
    publicKey: PublicKey;
    privateKey: PrivateKey;
}
