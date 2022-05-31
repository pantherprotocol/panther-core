export interface ICiphertext {
    iv: string;
    data: Uint8Array;
}

export type Plaintext = BigInt[];
