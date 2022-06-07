import * as _ from 'lodash';
import {utils} from 'ethers';
import {RewardMaster} from '../types/contracts/RewardMaster';
import {Staking} from '../types/contracts/Staking';
import {StakeRewardController} from '../types/contracts/StakeRewardController';
import {classicActionHash, advancedActionHash, STAKE, UNSTAKE} from './hash';
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

export async function addRewardAdviser(
    rewardMaster: RewardMaster,
    stakingAddress: string,
    newAdviserAddress: string,
    config = {isClassic: true, replace: false},
) {
    const transactions = [];
    const receipts = [];
    for (const action of [STAKE, UNSTAKE]) {
        const actionHash = config.isClassic
            ? classicActionHash(action)
            : advancedActionHash(action);

        if (config.replace) {
            const txToRemove = await rewardMaster.removeRewardAdviser(
                stakingAddress,
                actionHash,
            );
            transactions.push(txToRemove);
            receipts.push(await txToRemove.wait());
        }

        const txToAdd = await rewardMaster.addRewardAdviser(
            stakingAddress,
            actionHash,
            newAdviserAddress,
        );
        transactions.push(txToAdd);
        receipts.push(await txToAdd.wait());
    }
    return {transactions, receipts};
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
