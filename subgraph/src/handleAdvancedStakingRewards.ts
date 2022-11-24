// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {NewCommitments} from '../generated/PantherPoolV0/PantherPoolV0';
import {RewardGenerated} from '../generated/AdvancedStakeRewardController/AdvancedStakeRewardController';

import {createOrUpdateStaker} from './utils/staker';
import {createOrUpdateAdvancedStakingReward} from './utils/advancedStakingReward';
import {createTriad} from './utils/triad';

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
    const leftLeafId = event.params.leftLeafId;

    createOrUpdateStaker(stakerId, event.block);

    createOrUpdateAdvancedStakingReward({
        advancedStakingRewardId: leftLeafId.toHexString(),
        creationTime: event.block.timestamp.toI32(),
        commitments: event.params.commitments,
        utxoData: event.params.utxoData,
        zZkpAmount: null,
        staker: stakerId,
    });

    createTriad({
        triadId: leftLeafId.toHexString(),
        leafId: leftLeafId,
        commitments: event.params.commitments,
        utxoData: event.params.utxoData,
        block: event.block,
        txHash: event.transaction.hash,
    });
}
