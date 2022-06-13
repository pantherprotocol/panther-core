import {describe, expect} from '@jest/globals';
import {BigNumber, utils} from 'ethers';

describe('Advanced stakes', () => {
    process.env.ADVANCED_STAKING_T_START = '1652356800000';
    process.env.ADVANCED_STAKING_T_END = '1656590400000';

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

    const currentTime = new Date('2022-05-17T12:00:00Z');
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
        it('should always be less than staked amount', () => {
            const dates = [T_START, T_START + tenDays, T_END - tenDays, T_END];
            dates.forEach((date: number) => {
                const stake = BigNumber.from(100);
                const reward = zZkpReward(stake, date);
                expect(stake.gte(reward)).toBe(true);
            });
        });

        it('should have exact value at beginning of staking', () => {
            const stake = BigNumber.from(1e9);
            const reward = zZkpReward(stake, start);
            expect(reward.toString()).toEqual('93972000');
        });

        it('should have exact value 10 days before end of staking', () => {
            const stake = BigNumber.from(1e9);
            const reward = zZkpReward(stake, beforeEnd);
            expect(reward.toString()).toEqual('13726000');
        });

        it('should throw error if time is before start', () => {
            const stake = BigNumber.from(100);
            expect(() => zZkpReward(stake, T_START - tenDays)).toThrowError();
        });

        it('should throw error if time is after end', () => {
            const stake = BigNumber.from(100);
            expect(() => zZkpReward(stake, T_END + tenDays)).toThrowError();
        });
    });

    describe('PRP rewards', () => {
        it('should always be 10,000', () => {
            const reward = prpReward().toString();
            expect(reward).toBe(utils.parseEther('10000').toString());
        });
    });
});
