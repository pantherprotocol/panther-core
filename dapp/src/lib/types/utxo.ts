import {Asset} from './asset';
import {ICommitment} from './event';
import {IKeypair} from './keypair';

//should have commitment and nullifier wit utxo as base class

export interface UTXO {
    startTime: Date;
    endTime: Date;
    amount: bigint;
    asset: Asset;
    //tree: bigint
    leafIndex: number;
    commitment: ICommitment;
}

export interface InUTXO extends UTXO {
    nullifier: string;
    keypair: IKeypair;
}

export interface OutUTXO {
    publicKey: bigint;
}
