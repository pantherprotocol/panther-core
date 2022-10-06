import {log} from '@graphprotocol/graph-ts';

import {AdvancedStakingReward} from '../../generated/schema';
import {AdvancedStakingRewardParameters} from '../types/stakerReward';

function createOrLoadAdvancedStakingReward(
    advancedStakingRewardId: string,
    stakerId: string,
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
            advancedStakingRewardId,
            stakerId,
        ]);
    }

    log.info('Advanced staking reward was found {} {}', [
        advancedStakingRewardId,
        stakerId,
    ]);

    return advancedStakingReward;
}

export function createOrUpdateAdvancedStakingReward(
    params: AdvancedStakingRewardParameters,
): AdvancedStakingReward {
    const advancedStakingReward = createOrLoadAdvancedStakingReward(
        params.advancedStakingRewardId,
        params.staker,
        params.creationTime,
    );

    if (params.commitments)
        advancedStakingReward.commitments = params.commitments;

    if (params.utxoData) advancedStakingReward.utxoData = params.utxoData;

    if (params.zZkpAmount) advancedStakingReward.zZkpAmount = params.zZkpAmount;

    advancedStakingReward.staker = params.staker;

    advancedStakingReward.save();

    log.info('Advanced staking reward was updated {} {}', [
        params.advancedStakingRewardId,
        params.staker,
    ]);

    return advancedStakingReward;
}
