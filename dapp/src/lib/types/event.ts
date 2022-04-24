export interface ICommitmentsEvent {
    createTime: number;
    commitments: ICommitment[];
    leftLeafId: bigint;
}

export interface ICommitment {
    leafId: bigint;
    iv: bigint;
    hash: bigint;
    senderEphemeralKey: [x: bigint, y: bigint];
    secrets: ICommitmentSecrets;
    plaintext: ICommitmentPlaintext;
}

export interface ICommitmentSecrets {
    token: bigint;
    amount: bigint;
    random: bigint;
}

export interface ICommitmentPlaintext {
    token: bigint;
    amount: bigint;
    random: bigint;
}

export interface ICiphertext {
    iv: Buffer;
    data: string;
}
