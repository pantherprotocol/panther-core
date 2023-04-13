// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2022-23 Panther Ventures Limited Gibralta

// invertMap is a helper function that inverts a Map<K, V> to a Map<V, K>.
// Creates a new Map where the keys are the original map's values and the values
// are the original map's keys.
export function invertMap<K, V>(map: Map<K, V>): Map<V, K> {
    const invertedMap = new Map<V, K>();
    for (const [key, value] of map.entries()) {
        invertedMap.set(value, key);
    }
    return invertedMap;
}
