// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {describe, expect} from '@jest/globals';
import dayjs, {Dayjs} from 'dayjs';
import {formatRemainingPeriod} from 'lib/format';

describe('Checking Dates', () => {
    const currentTime = dayjs();

    const TEST_CASES = [
        [currentTime.subtract(1, 'day'), '-', 'before current time'],
        [currentTime.add(23, 'hour'), '23 hours', 'after less than one day'],
        [currentTime.add(25, 'hour'), '2 days', 'after more than one day'],
        [currentTime.add(48, 'hour'), '2 days', 'after exactly two days'],
        [currentTime.add(49, 'hour'), '3 days', 'after more than two days'],
        [currentTime.add(90, 'day'), '90 days', 'after 90 day'],
        [currentTime.add(150, 'day'), '150 days', 'after 150 day'],
        [currentTime.add(180, 'day'), '180 days', 'after 180 day'],
    ];

    describe('Formatted remaining period:', () => {
        for (const [input, expected, title] of TEST_CASES) {
            it(`should be (${expected}) for (${title})`, () => {
                expect(formatRemainingPeriod(input as Dayjs)).toEqual(expected);
            });
        }
    });
});
