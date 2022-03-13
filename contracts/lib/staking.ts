import {utils} from 'ethers';
import * as _ from 'lodash';

import {RewardMaster} from '../types/contracts/RewardMaster';
import {Staking} from '../types/contracts/Staking';
import {StakeRewardController} from '../types/contracts/StakeRewardController';
import {classicActionHash, STAKE, UNSTAKE} from './hash';
import {toDate} from './units-shortcuts';

export async function showStake(
    staking: Staking,
    addr: string,
    stakeId: number,
) {
    const stake = await staking.stakes(addr, stakeId);
    return [
        utils.formatEther(stake.amount),
        toDate(stake.stakedAt),
        toDate(stake.claimedAt),
    ];
}

export async function replaceRewardAdviser(
    rewardMaster: RewardMaster,
    stakingAddress: string,
    newAdviserAddress: string,
) {
    const txns = [];
    const receipts = [];
    for (const action of [STAKE, UNSTAKE]) {
        const actionHash = classicActionHash(action);
        const tx1 = await rewardMaster.removeRewardAdviser(
            stakingAddress,
            actionHash,
        );
        txns.push(tx1);
        receipts.push(await tx1.wait());
        const tx2 = await rewardMaster.addRewardAdviser(
            stakingAddress,
            actionHash,
            newAdviserAddress,
        );
        txns.push(tx2);
        receipts.push(await tx2.wait());
    }
    return {txns, receipts};
}

interface HistoricalDatapoint {
    amount: string;
    timestamp: number;
}

export async function saveHistoricalData(
    controller: StakeRewardController,
    data: HistoricalDatapoint[],
) {
    const chunks = _.chunk(data, 500);
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const historyEnd =
            i < chunks.length - 1 ? 0 : chunk[chunk.length - 1].timestamp + 100;
        console.log(
            `Submitting ${chunk.length} historical stakes, end ${historyEnd} ...`,
        );
        const tx = await controller.saveHistoricalData(
            chunk.map(e => e.amount),
            chunk.map(e => e.timestamp),
            historyEnd,
        );
        await tx.wait();
        console.log(`   ... saved.`);
    }
    if (!(await controller.isInitialized())) {
        throw `Controller was not initialized after saving historical data`;
    }
}
