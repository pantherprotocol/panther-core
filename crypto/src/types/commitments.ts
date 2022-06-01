export type NewCommitmentEvent = {
    name: string;
    leftLeafId: string;
    creationTime: string;
    commitments: string[];
    utxoData: string;
    txHash: string;
    blockNumber: number;
    blockTimestamp: number;
    address: string;
    date: string;
};
