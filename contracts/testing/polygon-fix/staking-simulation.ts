import fs from 'fs';
import _ from 'lodash';
import {Wallet, utils} from 'ethers';
import {assert} from 'console';

import {toDate} from '../../lib/units-shortcuts';
import {getBlockTimestamp} from '../../lib/provider';

import stakedHistory from './data/staking_3.json';

const REWARD_TOKENS_PER_SECOND = 2000000 / 56 / 60 / 60 / 24;

function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
}

function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
        /[xy]/g,
        function (c) {
            const r = (Math.random() * 16) | 0,
                v = c == 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        },
    );
}

interface StakingAction {
    address: string;
    uuid: string;
    amount: string;
    timestamp: number;
    date: Date;
    action: string;
    type: string;
    stakedAt: number;
    lockedTill: number;
    unstakedAt: number;
    amountDec: number;
    durationDays: number;
    stakedDate: Date;
    unstakedDate: Date;
    rewards: number;
    APY?: number;
}

async function main() {
    console.log('Loading history ...');
    const stakingRecords: StakingAction[] = stakedHistory.map((rec: any) => {
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
    const existingStakers = _.uniq(stakingRecords.map(r => r.address));
    console.log(
        'Loaded',
        stakingRecords.length,
        'records from',
        existingStakers.length,
        'unique stakers',
    );

    await addSimulatedStakes(200, stakingRecords);

    const unstakingRecords = stakingRecords.map((rec: any) => {
        return {
            ...rec,
            action: 'unstaking',
            type: 'simulated',
            timestamp: Number(rec.unstakedAt),
        };
    });

    console.log('Combining records ...');
    let actions = [...stakingRecords, ...unstakingRecords];
    console.log('Sorting records ...');
    actions = actions.sort((a, b) => a.timestamp - b.timestamp);

    const {startTimestamp, endTimestamp} = doSimulation(actions);

    console.log('Calculating APY ...');
    actions.map((r: any) => {
        r.APY = (((r.rewards / r.amountDec) * 100) / r.durationDays) * 365;
    });

    const outFile = __dirname + '/data/actions.json';
    fs.writeFileSync(outFile, JSON.stringify(actions, null, 2));
    console.log(`Wrote to ${outFile}`);

    const totalRewards = _.sumBy(actions, i => i.rewards);
    console.log('totalRewards', totalRewards);

    const contractRewards =
        (endTimestamp - startTimestamp) * REWARD_TOKENS_PER_SECOND;
    console.log('Contract generated rewards: ', contractRewards);

    console.log('Delta:', contractRewards - totalRewards);
}

function getStakerAddress(existingStakers: string[], count: number): string {
    const totalStakers = existingStakers.length + count;
    const stakerIndex = getRandomInt(totalStakers);
    if (stakerIndex < existingStakers.length) {
        return existingStakers[stakerIndex];
    }
    return Wallet.createRandom().address;
}

async function addSimulatedStakes(
    count: number,
    stakingRecords: StakingAction[],
) {
    const forkTime = await getBlockTimestamp(
        Number(process.env.HARDHAT_FORKING_BLOCK),
    );
    console.log('Fork occurred at', forkTime, `(${toDate(forkTime)})`);

    const minStakeTimeForSimulatedStake = Math.max(
        forkTime,
        ...stakingRecords.map(stakeRecord => stakeRecord.stakedAt),
    );
    console.log(
        'Earliest time for new simulated stakes:',
        minStakeTimeForSimulatedStake,
        `(${toDate(minStakeTimeForSimulatedStake)})`,
    );

    const maxUnstakingTimeForSimulatedStake = stakingRecords
        .map(stakeRecord => stakeRecord.unstakedAt)
        .reduce((a, b) => Math.max(a, b), 0);

    const existingStakers = _.uniq(stakingRecords.map(r => r.address));

    console.log('Adding', count, 'simulated stakes ...');
    const lockedPeriod = 7 * 24 * 3600;
    for (let i = 0; i < count; i++) {
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
        const address = getStakerAddress(existingStakers, count);

        stakingRecords.push({
            action: 'staking',
            address,
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
    const finalStakers = _.uniq(stakingRecords.map(r => r.address));
    const delta = finalStakers.length - existingStakers.length;
    console.log(
        'Added',
        delta,
        'new stakers;',
        finalStakers.length,
        'in total',
    );
}

function doSimulation(actions: StakingAction[]) {
    console.log('Simulating ...');

    let currentlyStaked: any[] = [];
    const startTimestamp = Math.floor(
        +new Date('Mon 7 Mar 23:59:59 UTC 2022') / 1000,
    );
    let prevTimeStamp = startTimestamp;

    actions.forEach((action: any) => {
        const totalAccumulatedRewards =
            (action.timestamp - prevTimeStamp) * REWARD_TOKENS_PER_SECOND;

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
            if (!current) {
                throw `Couldn't find unstaking action with uuid ${staked.uuid}`;
            }
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

    return {startTimestamp, endTimestamp: prevTimeStamp};
}

main();
