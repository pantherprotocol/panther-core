import {BigInt, Bytes, ethereum} from '@graphprotocol/graph-ts';

export class TriadParameters {
    triadId: string;
    leafId: BigInt;
    commitments: Array<Bytes>;
    utxoData: Bytes;
    txHash: Bytes;
    block: ethereum.Block;
}
