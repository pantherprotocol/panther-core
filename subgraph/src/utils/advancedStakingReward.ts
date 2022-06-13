import {log} from '@graphprotocol/graph-ts';

import {AdvancedStakingReward} from '../../generated/schema';
import {AdvancedStakingRewardParameters} from '../types/stakerReward';

function createOrLoadAdvancedStakingReward(
    advancedStakingRewardId: string,
    creationTime: i32,
): AdvancedStakingReward {
    let advancedStakingReward = AdvancedStakingReward.load(
        advancedStakingRewardId,
    );

    if (advancedStakingReward == null) {
        advancedStakingReward = new AdvancedStakingReward(
            advancedStakingRewardId,
        );
        advancedStakingReward.creationTime = creationTime;

        log.info('New advanced staking reward was created {} {}', [
            advancedStakingReward.id,
            advancedStakingReward.staker,
        ]);
    }

    log.info('Advanced staking reward was found {} {}', [
        advancedStakingReward.id,
        advancedStakingReward.staker,
    ]);

    return advancedStakingReward;
}

export function createOrUpdateAdvancedStakingReward(
    params: AdvancedStakingRewardParameters,
): AdvancedStakingReward {
    const advancedStakingReward = createOrLoadAdvancedStakingReward(
        params.advancedStakingRewardId,
        params.creationTime,
    );

    if (params.commitments)
        advancedStakingReward.commitments = params.commitments;

    if (params.utxoData) advancedStakingReward.utxoData = params.utxoData;

    if (params.zZkpAmount) advancedStakingReward.zZkpAmount = params.zZkpAmount;
    if (params.prpAmount) advancedStakingReward.prpAmount = params.prpAmount;

    advancedStakingReward.staker = params.staker;

    advancedStakingReward.save();

    log.info('Advanced staking reward was updated {} {}', [
        advancedStakingReward.id,
        advancedStakingReward.staker,
    ]);

    return advancedStakingReward;
}
