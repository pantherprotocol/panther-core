// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {describe, expect} from '@jest/globals';
import {constants, utils} from 'ethers';
import mockConsole from 'jest-mock-console';

describe('Advanced stakes', () => {
    process.env.ADVANCED_STAKING_T_START = '1652356800'; // 2022/05/12 12:00 UTC
    process.env.ADVANCED_STAKING_T_END = '1656590400'; // 2022/06/30 12:00 UTC
    process.env.ADVANCED_STAKING_APY_START = '70';
    process.env.ADVANCED_STAKING_APY_END = '40';

    // Next line produces the following lint error, therefore disabled:
    // "Require statement not part of import statement
    // @typescript-eslint/no-var-requires"
    const {
        unrealizedPrpReward,
        getAdvStakingAPY,
        zZkpReward,
        prpReward,
        T_START,
        T_END,
    } = require('../../src/services/rewards'); // eslint-disable-line

    const currentTime = new Date('2022-05-17T12:00:00Z'); // 5 days after start
    const oneDay = 3600 * 24 * 1000;
    const tenDays = oneDay * 10;
    const beforeStart = T_START - tenDays;
    const start = T_START;
    const afterStart = T_START + tenDays;
    const beforeEnd = T_END - tenDays;
    const end = T_END;
    const afterEnd = T_END + tenDays;

    describe('Linear APY', () => {
        const currentApy = getAdvStakingAPY(Math.floor(currentTime.getTime()));

        it('should be a number', () => {
            expect(typeof currentApy).toEqual('number');
        });

        it(`should be between 40 and 70`, () => {
            const dates = [
                T_START - tenDays,
                T_START,
                T_START + tenDays,
                T_END - tenDays,
                T_END,
                T_END + tenDays,
            ];
            dates.forEach((date: number) => {
                const apy = getAdvStakingAPY(date);
                expect(apy).toBeGreaterThanOrEqual(40);
                expect(apy).toBeLessThanOrEqual(70);
            });
        });

        it(`should be exact APY values for specified moments in time`, () => {
            expect(getAdvStakingAPY(beforeStart)).toEqual(70);
            expect(getAdvStakingAPY(start)).toEqual(70);
            expect(getAdvStakingAPY(afterStart)).toEqual(63.87755102040816);
            expect(getAdvStakingAPY(beforeEnd)).toEqual(46.12244897959184);
            expect(getAdvStakingAPY(end)).toEqual(40);
            expect(getAdvStakingAPY(afterEnd)).toEqual(40);
        });
    });

    describe('zZKP rewards', () => {
        let restoreConsole: any;

        beforeEach(() => {
            restoreConsole = mockConsole();
        });

        afterEach(() => {
            restoreConsole();
        });

        it('should always be less than staked amount', () => {
            const dates = [T_START, T_START + tenDays, T_END - tenDays, T_END];
            dates.forEach((date: number) => {
                const stake = utils.parseEther('1000');
                const reward = zZkpReward(stake, date, T_END);
                expect(stake.gte(reward)).toBe(true);
            });
        });

        it('should have exact value at beginning of staking', () => {
            const stake = utils.parseEther('1000');
            const reward = zZkpReward(stake, start, T_END);
            expect(utils.formatEther(reward).toString()).toEqual(
                '93.97260273972602',
            );
        });

        it('should have exact value 10 days before end of staking', () => {
            const stake = utils.parseEther('1000');
            const reward = zZkpReward(stake, beforeEnd, T_END);
            expect(utils.formatEther(reward).toString()).toEqual(
                '12.636287391668996',
            );
        });

        it('should return max rewards if time is before start', () => {
            const stake = utils.parseEther('1000');
            const reward = zZkpReward(stake, beforeStart, T_END);
            expect(utils.formatEther(reward).toString()).toEqual(
                '93.97260273972602',
            );
            expect(console.warn).toHaveBeenCalledWith(
                '1000.0 ZKP was staked at 1651492800000 ' +
                    '(Mon May 02 2022 12:00:00 GMT+0000 (Coordinated Universal Time)), ' +
                    'before the start of the rewards 1652356800000 ' +
                    '(Thu May 12 2022 12:00:00 GMT+0000 (Coordinated Universal Time)); ' +
                    'treating as if staked at the starting time.',
            );
        });

        it('should return 0 if time is after end', () => {
            const stake = utils.parseEther('1000');
            const reward = zZkpReward(stake, afterEnd, T_END);
            expect(reward).toEqual(constants.Zero);
            expect(console.warn).toHaveBeenCalledWith(
                '1000.0 ZKP was staked at 1657454400000 ' +
                    '(Sun Jul 10 2022 12:00:00 GMT+0000 (Coordinated Universal Time)), ' +
                    'after the end of the rewards 1656590400000 ' +
                    '(Thu Jun 30 2022 12:00:00 GMT+0000 (Coordinated Universal Time)); ' +
                    'treating as zero reward.',
            );
        });
    });

    describe('PRP rewards', () => {
        describe('Upon stake', () => {
            it('should always be 2,000', () => {
                const reward = prpReward().toString();
                expect(reward).toBe('2000');
            });
        });

        describe('Unrealized rewards exact values', () => {
            it('should be 1000 PRP for 1000 zZKP and 365 days', () => {
                const zZkp = utils.parseEther('1000');
                const unrealizedReward = unrealizedPrpReward(
                    zZkp,
                    start,
                    start + 365 * oneDay,
                );

                expect(unrealizedReward.toString()).toEqual('1000');
            });

            it('should be 50 PRP for 100 zZKP and 185 days', () => {
                const zZkp = utils.parseEther('100');
                const unrealizedReward = unrealizedPrpReward(
                    zZkp,
                    start,
                    start + 185 * oneDay,
                );

                expect(unrealizedReward.toString()).toEqual('50');
            });

            it('should be 2 PRP for 1000 zZKP and 1 day', () => {
                const zZkp = utils.parseEther('1000');
                const unrealizedReward = unrealizedPrpReward(
                    zZkp,
                    start,
                    start + oneDay,
                );

                expect(unrealizedReward.toString()).toEqual('2');
            });

            it('should be 0 PRP for 10 zZKP and 1 day', () => {
                const zZkp = utils.parseEther('10');
                const unrealizedReward = unrealizedPrpReward(
                    zZkp,
                    start,
                    start + oneDay,
                );

                expect(unrealizedReward.toString()).toEqual('0');
            });
        });
    });
});
