import {utils} from 'ethers';

import {RewardMaster} from '../types/contracts/RewardMaster';
import {Staking} from '../types/contracts/Staking';
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
