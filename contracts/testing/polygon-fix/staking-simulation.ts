// Run via: yarn ts-node testing/polygon-fix/staking-simulation.ts

import fs from 'fs';
import _ from 'lodash';
import {BigNumber, constants, Wallet, utils} from 'ethers';
import {assert} from 'console';

import {fe, pe, parseDate, toDate} from '../../lib/units-shortcuts';
import {getBlockTimestamp} from '../../lib/provider';

import stakedHistory from './data/staking-events-till-25884010.json';

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
    rewardsBN?: BigNumber;
    rewards?: number;
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
            date: toDate(stakedAt),
            action: 'staking',
            type: 'real',
            stakedAt,
            lockedTill: Number(rec.lockedTill),
            unstakedAt,
            amountDec: Number(fe(rec.amount)),
            durationDays: (unstakedAt - stakedAt) / (24 * 3600),
            stakedDate: toDate(stakedAt),
            unstakedDate: toDate(unstakedAt),
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
            date: toDate(rec.unstakedAt),
            rewardsBN: constants.Zero,
        };
    });

    console.log('Combining records ...');
    let actions = [...stakingRecords, ...unstakingRecords];
    console.log('Sorting records ...');
    actions = actions.sort((a, b) => a.timestamp - b.timestamp);

    const {startTimestamp, endTimestamp} = doSimulation(actions);

    const totalRewards = actions
        .filter(i => i.action === 'unstaking')
        .map(i => i.rewardsBN)
        .reduce((acc, r) => acc.add(r));

    console.log('Calculating APY ...');
    actions.forEach((r: any) => {
        r.APY =
            (Number(fe(r.rewardsBN.mul(pe('100')).div(r.amount))) * 365) /
            r.durationDays;
        r.rewards = Number(fe(r.rewardsBN));
        r.rewardsBN = r.rewardsBN.toString();
    });

    const outFile = __dirname + '/data/actions.json';
    fs.writeFileSync(outFile, JSON.stringify(actions, null, 2));
    console.log(`Wrote to ${outFile}`);

    console.log('totalRewards', fe(totalRewards));
    const contractRewards =
        (endTimestamp - startTimestamp) * REWARD_TOKENS_PER_SECOND;
    console.log('Vested rewards: ', contractRewards);

    console.log('Delta:', fe(totalRewards.sub(pe(String(contractRewards)))));
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
    const forkTime =
        Number(process.env.HARDHAT_FORKING_BLOCK_TIME) ||
        (await getBlockTimestamp(Number(process.env.HARDHAT_FORKING_BLOCK)));
    console.log('Fork occurred at', forkTime, `(${toDate(forkTime)})`);

    // Can't stake before fork occurred, because fork can't go backwards in time.
    const minStakingTime = Math.max(
        forkTime,
        ...stakingRecords.map(stakeRecord => stakeRecord.stakedAt),
    );
    console.log(
        'Earliest time for new simulated stakes:',
        minStakingTime,
        `(${toDate(minStakingTime)})`,
    );

    // https://docs.pantherprotocol.io/dao/governance/proposal-3-polygon-extension/staking
    const maxStakingTime = parseDate('27 Apr 2022 00:00 UTC');
    console.log(
        'Latest time for new simulated stakes:',
        maxStakingTime,
        `(${toDate(maxStakingTime)})`,
    );

    // A few days after staking program ends
    const maxUnstakingTime = parseDate('10 May 2022 UTC');
    console.log(
        'Latest time for simulated unstaking:',
        maxUnstakingTime,
        `(${toDate(maxUnstakingTime)})`,
    );

    const existingStakers = _.uniq(stakingRecords.map(r => r.address));

    console.log('Adding', count, 'simulated stakes ...');
    const lockedPeriod = 7 * 24 * 3600;

    for (let i = 0; i < count; i++) {
        const stakedAt =
            minStakingTime + getRandomInt(maxStakingTime - minStakingTime);

        const lockedTill = stakedAt + lockedPeriod;
        const unstakedAt =
            lockedTill + getRandomInt(maxUnstakingTime - lockedTill);

        assert(minStakingTime <= stakedAt);
        assert(stakedAt < lockedTill);
        assert(stakedAt <= maxStakingTime);
        assert(lockedTill <= unstakedAt);
        assert(unstakedAt <= maxUnstakingTime);

        const stakedAmountDec = getRandomInt(10_000) + 100;
        const address = getStakerAddress(existingStakers, count);

        stakingRecords.push({
            action: 'staking',
            address,
            uuid: uuid(),
            timestamp: stakedAt,
            date: toDate(stakedAt),
            type: 'simulated',
            stakedAt,
            lockedTill,
            unstakedAt,
            amountDec: stakedAmountDec,
            amount: utils.parseUnits(stakedAmountDec.toString(), 18).toString(),
            durationDays: (unstakedAt - stakedAt) / (24 * 3600),
            stakedDate: toDate(stakedAt),
            unstakedDate: toDate(unstakedAt),
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
    const [historical, toSimulate] = _.partition(
        actions,
        a => a.type === 'real',
    );
    const [staking, unstaking] = _.partition(
        actions,
        a => a.action === 'staking',
    );

    console.log(
        'Simulating',
        actions.length,
        'actions:',
        staking.length,
        'staking /',
        unstaking.length,
        'unstaking /',
        historical.length,
        'historical /',
        toSimulate.length,
        'synthetic',
    );

    let currentlyStaked: any[] = [];
    let totalStaked = constants.Zero;
    let totalStakes = 0;

    // https://docs.pantherprotocol.io/dao/governance/proposal-3-polygon-extension/staking
    const startTimestamp = parseDate('Mon 7 Mar 23:59:59 UTC 2022');
    const endTimestamp = parseDate('Mon 2 May 23:59:59 UTC 2022');
    let prevTimeStamp = startTimestamp;

    const unstakingByUuid = _.keyBy(unstaking, a => a.uuid);
    let isFirstStake = true;

    actions.forEach((action: any) => {
        const deltaVestedRewards =
            prevTimeStamp > endTimestamp
                ? 0
                : (Math.min(endTimestamp, action.timestamp) - prevTimeStamp) *
                  REWARD_TOKENS_PER_SECOND;

        if (action.action === 'staking' && isFirstStake) {
            currentlyStaked.push(action);
            totalStaked = totalStaked.add(action.amount);
            totalStakes += 1;
        }

        if (totalStaked.gt(constants.Zero)) {
            currentlyStaked.forEach((staked: any) => {
                const unstakingAction = unstakingByUuid[staked.uuid];
                if (!unstakingAction) {
                    throw `Couldn't find unstaking action with uuid ${staked.uuid}`;
                }
                if (!unstakingAction.rewardsBN) {
                    throw `Action missing rewardsBN: ${action}`;
                }
                staked.rewardsBN = unstakingAction.rewardsBN =
                    unstakingAction.rewardsBN.add(
                        utils
                            .parseEther(String(deltaVestedRewards))
                            .mul(unstakingAction.amount)
                            .div(totalStaked),
                    );
            });
        }

        if (action.action === 'staking' && !isFirstStake) {
            currentlyStaked.push(action);
            totalStaked = totalStaked.add(action.amount);
            totalStakes += 1;
        }

        if (action.action === 'unstaking') {
            currentlyStaked = currentlyStaked.filter(
                (staked: any) => staked.uuid !== action.uuid,
            );

            totalStaked = totalStaked.sub(action.amount);
            totalStakes -= 1;
        }

        const amount = fe(action.amount).replace(/(\.\d{2}).+/, '$1');
        const paddedAmount = ' '.repeat(10 - amount.length) + amount;
        const date = toDate(action.timestamp).toISOString();
        const padAction = ' '.repeat(9 - action.action.length) + action.action;
        console.log(
            `${padAction} @ ${date} for ${paddedAmount}`,
            `  ${totalStakes} staked, total: ${fe(totalStaked)}`,
        );

        prevTimeStamp = action.timestamp;
        isFirstStake = false;
    });

    return {startTimestamp, endTimestamp};
}

main();
