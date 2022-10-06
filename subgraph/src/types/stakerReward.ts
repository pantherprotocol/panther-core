import {BigInt, Bytes} from '@graphprotocol/graph-ts';

export class AdvancedStakingRewardParameters {
    advancedStakingRewardId: string;
    creationTime: i32;
    commitments: Array<Bytes> | null;
    utxoData: Bytes | null;
    zZkpAmount: BigInt | null;
    staker: string;
}
