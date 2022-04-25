export interface ICiphertext {
    iv: string;
    data: string;
}

export type Plaintext = BigInt[];
