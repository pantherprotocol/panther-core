// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {describe, expect} from '@jest/globals';
import {addDays, addHours, subDays} from 'date-fns';
import {formatRemainingPeriod} from 'lib/format';

describe('Checking Dates', () => {
    const currentTime = new Date();

    const TEST_CASES = [
        [subDays(currentTime, 1), '-', 'before current time'],
        [addHours(currentTime, 23), '23 hours', 'after less than one day'],
        [addHours(currentTime, 25), '2 days', 'after more than one day'],
        [addHours(currentTime, 48), '2 days', 'after exactly two days'],
        [addHours(currentTime, 49), '3 days', 'after more than two days'],
        [addDays(currentTime, 90), '90 days', 'after 90 day'],
        [addDays(currentTime, 150), '150 days', 'after 150 day'],
        [addDays(currentTime, 180), '180 days', 'after 180 day'],
    ];

    describe('Formatted remaining period:', () => {
        for (const [input, expected, title] of TEST_CASES) {
            it(`should be (${expected}) for (${title})`, () => {
                expect(formatRemainingPeriod(input as Date)).toEqual(expected);
            });
        }
    });
});
