import {describe, expect} from '@jest/globals';
import {constants, utils} from 'ethers';
import mockConsole from 'jest-mock-console';

describe('Advanced stakes', () => {
    process.env.ADVANCED_STAKING_T_START = '1652356800'; // 2022/05/12 12:00 UTC
    process.env.ADVANCED_STAKING_T_END = '1656590400'; // 2022/06/30 12:00 UTC

    // Next line produces the following lint error, therefore disabled:
    // "Require statement not part of import statement
    // @typescript-eslint/no-var-requires"
    const {
        getAdvStakingAPY,
        zZkpReward,
        prpReward,
        T_START,
        T_END,
    } = require('../../src/services/rewards'); // eslint-disable-line

    const currentTime = new Date('2022-05-17T12:00:00Z'); // 5 days after start
    const tenDays = 3600 * 24 * 10 * 1000;
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

        it(`should be between 45 and 70`, () => {
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
                expect(apy).toBeGreaterThanOrEqual(45);
                expect(apy).toBeLessThanOrEqual(70);
            });
        });

        it(`should be exact APY values for specified moments in time`, () => {
            expect(getAdvStakingAPY(beforeStart)).toEqual(70);
            expect(getAdvStakingAPY(start)).toEqual(70);
            expect(getAdvStakingAPY(afterStart)).toEqual(64.89795918367346);
            expect(getAdvStakingAPY(beforeEnd)).toEqual(50.10204081632653);
            expect(getAdvStakingAPY(end)).toEqual(45);
            expect(getAdvStakingAPY(afterEnd)).toEqual(45);
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
                '13.726586525020966',
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
        it('should always be 10,000', () => {
            const reward = prpReward().toString();
            expect(reward).toBe('10000');
        });
    });
});
