import {log, ethereum} from '@graphprotocol/graph-ts';
import {Staker} from '../../generated/schema';

function createOrLoadStaker(stakerId: string): Staker {
    let staker = Staker.load(stakerId);

    if (staker == null) {
        staker = new Staker(stakerId);

        log.info('New staker was created {}', [staker.id]);
    }

    log.info('Staker was found {}', [staker.id]);

    return staker;
}

export function createOrUpdateStaker(
    stakerId: string,
    block: ethereum.Block,
): Staker {
    const staker = createOrLoadStaker(stakerId);

    staker.lastUpdatedTime = block.timestamp.toI32();
    staker.lastBlockNumber = block.number.toI32();

    staker.save();

    log.info('Staker was updated {}', [staker.id]);

    return staker;
}
