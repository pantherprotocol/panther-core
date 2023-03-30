// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {oneDayInMs} from 'constants/time';

import {describe, expect} from '@jest/globals';
import {constants, utils} from 'ethers';
import mockConsole from 'jest-mock-console';
import {unrealizedPrpReward, zZkpReward} from 'services/rewards';

describe('Advanced stakes', () => {
    // stabbing the env variables in env.ts
    const {env} = require('../../src/services/env'); // eslint-disable-line
    env.ADVANCED_STAKING_APY = '15';

    const termsAllowedSince = 1652356800 * 1000;
    const termsAllowedTill = 1656590400 * 1000;
    const tenDays = oneDayInMs * 10;
    const beforeEnd = termsAllowedTill - tenDays;
    const afterEnd = termsAllowedTill + tenDays;

    describe('zZKP rewards', () => {
        let restoreConsole: any;

        beforeEach(() => {
            restoreConsole = mockConsole();
        });

        afterEach(() => {
            restoreConsole();
        });

        it('should always be less than staked amount', () => {
            const dates = [
                termsAllowedSince,
                termsAllowedSince + tenDays,
                termsAllowedTill - tenDays,
                termsAllowedTill,
            ];
            dates.forEach((date: number) => {
                const stake = utils.parseEther('1000');
                const reward = zZkpReward(
                    stake,
                    date,
                    termsAllowedTill,
                    termsAllowedSince,
                    termsAllowedTill,
                );
                expect(stake.gte(reward)).toBe(true);
            });
        });

        it('should have exact value at beginning of staking', () => {
            const stake = utils.parseEther('1000');
            const reward = zZkpReward(
                stake,
                termsAllowedSince,
                termsAllowedTill,
                termsAllowedSince,
                termsAllowedTill,
            );
            expect(utils.formatEther(reward).toString()).toEqual(
                '20.136986301369864',
            );
        });

        it('should have exact value 10 days before end of staking', () => {
            const stake = utils.parseEther('1000');
            const reward = zZkpReward(
                stake,
                beforeEnd,
                termsAllowedTill,
                termsAllowedSince,
                termsAllowedTill,
            );
            expect(utils.formatEther(reward).toString()).toEqual(
                '4.10958904109589',
            );
        });

        it('should return 0 if time is after end', () => {
            const stake = utils.parseEther('1000');
            const reward = zZkpReward(
                stake,
                afterEnd,
                termsAllowedTill,
                termsAllowedSince,
                termsAllowedTill,
            );
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
        describe('Unrealized rewards exact values', () => {
            it('should be 1000 PRP for 1000 zZKP and 365 days', () => {
                const zZkp = utils.parseEther('1000');
                const unrealizedReward = unrealizedPrpReward(
                    zZkp,
                    termsAllowedSince,
                    termsAllowedSince + 365 * oneDayInMs,
                );

                expect(unrealizedReward.toString()).toEqual('1000');
            });

            it('should be 50 PRP for 100 zZKP and 185 days', () => {
                const zZkp = utils.parseEther('100');
                const unrealizedReward = unrealizedPrpReward(
                    zZkp,
                    termsAllowedSince,
                    termsAllowedSince + 185 * oneDayInMs,
                );

                expect(unrealizedReward.toString()).toEqual('50');
            });

            it('should be 2 PRP for 1000 zZKP and 1 day', () => {
                const zZkp = utils.parseEther('1000');
                const unrealizedReward = unrealizedPrpReward(
                    zZkp,
                    termsAllowedSince,
                    termsAllowedSince + oneDayInMs,
                );

                expect(unrealizedReward.toString()).toEqual('2');
            });

            it('should be 0 PRP for 10 zZKP and 1 day', () => {
                const zZkp = utils.parseEther('10');
                const unrealizedReward = unrealizedPrpReward(
                    zZkp,
                    termsAllowedSince,
                    termsAllowedSince + oneDayInMs,
                );

                expect(unrealizedReward.toString()).toEqual('0');
            });
        });
    });
});
