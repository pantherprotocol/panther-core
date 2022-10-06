import {NewCommitments} from '../generated/PantherPoolV0/PantherPoolV0';
import {RewardGenerated} from '../generated/AdvancedStakeRewardController/AdvancedStakeRewardController';

import {createOrUpdateStaker} from './utils/staker';
import {createOrUpdateAdvancedStakingReward} from './utils/advancedStakingReward';

export function handleRewardGenerated(event: RewardGenerated): void {
    const stakerId = event.params.staker.toHexString();
    const advancedStakingRewardId = event.params.firstLeafId.toHexString();

    createOrUpdateStaker(stakerId, event.block);

    createOrUpdateAdvancedStakingReward({
        advancedStakingRewardId,
        creationTime: event.block.timestamp.toI32(),
        commitments: null,
        utxoData: null,
        zZkpAmount: event.params.zkp,
        staker: stakerId,
    });
}

export function handleNewCommitments(event: NewCommitments): void {
    const stakerId = event.transaction.from.toHexString();
    const advancedStakingRewardId = event.params.leftLeafId.toHexString();

    createOrUpdateStaker(stakerId, event.block);

    createOrUpdateAdvancedStakingReward({
        advancedStakingRewardId,
        creationTime: event.block.timestamp.toI32(),
        commitments: event.params.commitments,
        utxoData: event.params.utxoData,
        zZkpAmount: null,
        staker: stakerId,
    });
}
