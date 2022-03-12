import fs from 'fs';
import stakedHistory from './data/staking_3.json';
import {utils} from 'ethers';
import {assert} from 'console';

function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
}

function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
        /[xy]/g,
        function (c) {
            var r = (Math.random() * 16) | 0,
                v = c == 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        },
    );
}

function main() {
    const stakingRecords = stakedHistory.map((rec: any) => {
        const unstakedAt =
            Number(rec.lockedTill) + getRandomInt(30 * 24 * 3600);

        const stakedAt = Number(rec.timestamp);

        return {
            ...rec,
            uuid: uuid(),
            date: new Date(stakedAt * 1000),
            action: 'staking',
            type: 'real',
            stakedAt,
            lockedTill: Number(rec.lockedTill),
            unstakedAt,
            amountDec: Number(utils.formatEther(rec.amount)),
            durationDays: (unstakedAt - stakedAt) / (24 * 3600),
            stakedDate: new Date(stakedAt * 1000),
            unstakedDate: new Date(unstakedAt * 1000),
            rewards: 0,
        };
    });

    // Adding Simulated stakes:
    const minStakeTimeForSimulatedStake = stakingRecords
        .map(stakeRecord => stakeRecord.stakedAt)
        .reduce((a, b) => Math.max(a, b), 0);

    const maxUnstakingTimeForSimulatedStake = stakingRecords
        .map(stakeRecord => stakeRecord.unstakedAt)
        .reduce((a, b) => Math.max(a, b), 0);

    const simulatedStakeNum = 15;
    const lockedPeriod = 7 * 24 * 3600;
    for (let i = 0; i < simulatedStakeNum; i++) {
        const stakedAt =
            minStakeTimeForSimulatedStake +
            getRandomInt(
                maxUnstakingTimeForSimulatedStake -
                    minStakeTimeForSimulatedStake -
                    lockedPeriod,
            );

        const lockedTill = stakedAt + lockedPeriod;
        const unstakedAt =
            lockedTill +
            getRandomInt(maxUnstakingTimeForSimulatedStake - lockedTill);

        assert(minStakeTimeForSimulatedStake < stakedAt);
        assert(stakedAt < lockedTill);
        assert(lockedTill < unstakedAt);
        assert(unstakedAt < maxUnstakingTimeForSimulatedStake);

        const stakedAmountDec = getRandomInt(10_000) + 100;
        stakingRecords.push({
            action: 'staking',
            uuid: uuid(),
            timestamp: stakedAt,
            date: new Date(stakedAt * 1000),
            type: 'simulated',
            stakedAt,
            lockedTill,
            unstakedAt,
            amountDec: stakedAmountDec,
            amount: utils.parseUnits(stakedAmountDec.toString(), 18).toString(),
            durationDays: (unstakedAt - stakedAt) / (24 * 3600),
            stakedDate: new Date(stakedAt * 1000),
            unstakedDate: new Date(unstakedAt * 1000),
            rewards: 0,
        });
    }

    const unstakingRecords = stakingRecords.map((rec: any) => {
        return {
            ...rec,
            action: 'unstaking',
            type: 'simulated',
            timestamp: Number(rec.unstakedAt),
        };
    });

    let actions = [...stakingRecords, ...unstakingRecords];
    actions = actions.sort((a, b) => a.timestamp - b.timestamp);

    const tokenPerSecond = 2000000 / 56 / 60 / 60 / 24;
    let currentlyStaked: any[] = [];
    const startedTimestamp = Math.floor(
        +new Date('Mon 7 Mar 23:59:59 UTC 2022') / 1000,
    );
    let prevTimeStamp = startedTimestamp;

    actions.forEach((action: any) => {
        const totalAccumulatedRewards =
            (action.timestamp - prevTimeStamp) * tokenPerSecond;

        if (action.action === 'staking') {
            currentlyStaked.push(action);
        }

        const totalStaked = currentlyStaked
            .map((stake: any) => {
                return stake.amountDec;
            })
            .reduce((a, b) => a + b, 0);

        currentlyStaked.forEach((staked: any) => {
            const current = actions.find((s: any) => {
                return s.uuid === staked.uuid && s.action === 'unstaking';
            });

            current.rewards +=
                (totalAccumulatedRewards * current.amountDec) / totalStaked;
        });

        if (action.action === 'unstaking') {
            currentlyStaked = currentlyStaked.filter(
                (staked: any) => staked.uuid !== action.uuid,
            );
        }

        prevTimeStamp = action.timestamp;
    });

    actions.map((r: any) => {
        r.APY = (((r.rewards / r.amountDec) * 100) / r.durationDays) * 365;
    });

    fs.writeFileSync('actions.json', JSON.stringify(actions, null, 2));

    console.log(
        'totalRewards',
        actions.map((s: any) => s.rewards).reduce((a, b) => a + b, 0),
    );

    console.log(
        'Contract generated rewards: ',
        (prevTimeStamp - startedTimestamp) * tokenPerSecond,
    );
}

main();
