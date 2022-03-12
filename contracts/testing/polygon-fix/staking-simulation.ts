import fs from 'fs';
import stakedHistory from './data/staking_3.json';
import {utils} from 'ethers';

function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
}

function main() {
    const stakingRecords = stakedHistory.map((rec: any) => {
        const unstakedAt =
            Number(rec.lockedTill) + getRandomInt(30 * 24 * 3600);

        const stakedAt = Number(rec.timestamp);

        return {
            ...rec,
            action: 'staking',
            stakedAt,
            lockedTill: Number(rec.lockedTill),
            unstakedAt,
            amountDec: Number(utils.formatEther(rec.amount)),
            durationDays: (unstakedAt - stakedAt) / (24 * 3600),
            stakedDate: rec.date,
            rewards: 0,
        };
    });

    const unstakingRecords = stakingRecords.map((rec: any) => {
        return {
            ...rec,
            action: 'unstaking',
            timestamp: Number(rec.unstakedAt),
        };
    });

    let actions = [...stakingRecords, ...unstakingRecords];
    actions = actions.sort((a, b) => a.timestamp - b.timestamp);

    const tokenPerSecond = 2000000 / 56 / 60 / 60 / 24;
    let currentlyStaked: any[] = [];
    const startedTimestamp = 1646837699 - 100000; // Here we should probably have a timestamp of contract creation
    let prevTimeStamp = startedTimestamp;

    const rewards = actions.filter(
        (action: any) => action.action === 'staking',
    );

    actions.forEach((action: any) => {
        const totalAccumulatedRewards =
            (action.timestamp - prevTimeStamp) * tokenPerSecond;

        if (action.action === 'staking') {
            currentlyStaked.push(action);
        }

        if (action.action === 'unstaking') {
            currentlyStaked = currentlyStaked.filter(
                (staked: any) =>
                    staked.transactionHash !== action.transactionHash,
            );
        }

        const totalStaked = currentlyStaked
            .map((stake: any) => {
                return stake.amountDec;
            })
            .reduce((a, b) => a + b, 0);

        currentlyStaked.forEach((staked: any) => {
            const current = rewards.find((s: any) => {
                return s.transactionHash === staked.transactionHash;
            });

            current.rewards +=
                (totalAccumulatedRewards * current.amountDec) / totalStaked;
        });

        prevTimeStamp = action.timestamp;
    });

    rewards.map((r: any) => {
        r.APY = (((r.rewards / r.amountDec) * 100) / r.durationDays) * 365;
    });

    fs.writeFileSync('data/rewards.json', JSON.stringify(rewards, null, 2));
    fs.writeFileSync('data/actions.json', JSON.stringify(actions, null, 2));

    console.log(
        'totalRewards',
        rewards.map((s: any) => s.rewards).reduce((a, b) => a + b, 0),
    );

    console.log(
        'Contract generated rewards: ',
        (prevTimeStamp - startedTimestamp) * tokenPerSecond,
    );
}

main();
