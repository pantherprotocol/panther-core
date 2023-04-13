// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {invertMap} from 'lib/helpers';

describe('invertMap', () => {
    it('returns an empty map when the input map is empty', () => {
        const inputMap = new Map();
        const invertedMap = invertMap(inputMap);
        expect(invertedMap.size).toBe(0);
    });

    it('correctly inverts a map with unique values', () => {
        const inputMap = new Map<string, number>([
            ['a', 1],
            ['b', 2],
            ['c', 3],
        ]);
        const expectedInvertedMap = new Map<number, string>([
            [1, 'a'],
            [2, 'b'],
            [3, 'c'],
        ]);
        const invertedMap = invertMap(inputMap);
        expect(invertedMap).toEqual(expectedInvertedMap);
    });

    it('overwrites the previous key if there are duplicate values in the input map', () => {
        const inputMap = new Map<string, number>([
            ['a', 1],
            ['b', 1],
            ['c', 3],
        ]);
        const expectedInvertedMap = new Map<number, string>([
            [1, 'b'], // 'b' overwrites 'a' because it has the same value
            [3, 'c'],
        ]);
        const invertedMap = invertMap(inputMap);
        expect(invertedMap).toEqual(expectedInvertedMap);
    });

    it('handles undefined values in the input map', () => {
        const inputMap = new Map<string, number | undefined>([
            ['a', 1],
            ['b', undefined],
            ['c', 3],
        ]);
        const expectedInvertedMap = new Map<number | undefined, string>([
            [1, 'a'],
            [undefined, 'b'],
            [3, 'c'],
        ]);
        const invertedMap = invertMap(inputMap);
        expect(invertedMap).toEqual(expectedInvertedMap);
    });

    it('handles undefined keys in the input map', () => {
        const inputMap = new Map<string | undefined, number>([
            ['a', 1],
            [undefined, 2],
            ['c', 3],
        ]);
        const expectedInvertedMap = new Map<number, string | undefined>([
            [1, 'a'],
            [2, undefined],
            [3, 'c'],
        ]);
        const invertedMap = invertMap(inputMap);
        expect(invertedMap).toEqual(expectedInvertedMap);
    });
});
