import {log, BigInt} from '@graphprotocol/graph-ts';
import {Triad} from '../../generated/schema';
import {TriadParameters} from '../types/triad';
import {TREE_MAX_LEAF} from './constants';

export function createTriad(params: TriadParameters): Triad {
    let triad = Triad.load(params.triadId);

    if (triad == null) {
        triad = new Triad(params.triadId);
        log.info('New triad was created {}', [triad.id]);
    }

    triad.leafId = params.leafId.toU32();
    triad.treeId = params.leafId.div(BigInt.fromU32(TREE_MAX_LEAF)).toU32();
    triad.commitments = params.commitments;
    triad.utxoData = params.utxoData;

    triad.blockNumber = params.block.number.toU32();
    triad.creationTime = params.block.timestamp.toU32();
    triad.txHash = params.txHash;

    triad.save();

    return triad;
}
