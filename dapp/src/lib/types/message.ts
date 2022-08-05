export interface ICiphertext {
    iv: Uint8Array;
    data: Uint8Array;
}

export type Plaintext = bigint[];
