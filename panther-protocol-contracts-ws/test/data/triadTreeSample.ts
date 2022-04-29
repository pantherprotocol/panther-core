// SPDX-License-Identifier: MIT
import { toBytes32, Triad, zeroLeavesTriad } from '../../lib/utilities';

export function getTriadAt(index: number): Triad {
    return [
        toBytes32(3 * index + 1),
        toBytes32(3 * index + 2),
        toBytes32(3 * index + 3),
    ];
}
export const triads = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    [10, 11, 12],
    [13, 14, 15],
    [16, 17, 18],
    [19, 20, 21],
    [22, 23, 24],
].map((a: number[]) => a.map(e => toBytes32(e))) as Triad[];

export const rootsSeen = [
    '0x0cf1bd613b64b20a77f4d625296451f5f2600615560a4caa3b2c7c418c56787f',
    '0x19b2d668d60e341944c345863d8a6fb01e9f763a71db0a30d2db863a7ff853f5',
    '0x0cac857cd8247fb498beac409282540a9daa457a596a744861676e8affb0204b',
    '0x084b3c65797d297e12ed3317dbe1f9e85777b2ead2f28474ed92138552f17dd8',
    '0x20113bb9a1ba6bc4e34c095622a0df6b1ba70786db1f720f58e4d3b8d9c0e212',
    '0x1d9fcb0575b817e3d550c367b7cd6e03d2cc2b15d639e74fccc41dc0cba4dad3',
    '0x204b40f053b909966b94f8755b758b9b6e7b0805dc649d19d34320fb4190f79d',
    '0x0ad10cd89187dd889c94b3764ed4d4b58d328018abf430e65dd474e255c71712',
];

/**
 * Codes for generating the above roots:

 // Pre-requisite: import `poseidon2or3` and `TriadMerkleTree` from `preZkp/`crypto`

 const tree = new TriadMerkleTree(15, BigInt(zeroLeaf), poseidon2or3);
 const triads = Array(8)
 .fill(0)
 .map((_, i) => [BigInt(3 * i + 1), BigInt(3 * i + 2), BigInt(3 * i + 3)]);

 const seenRoots = triads.map((triad) => {
    tree.insertBatch(triad);
    return "0x" + tree.root.toString(16);
    });
*/

export const dataForCacheTest = {
    triads: {
        for1stCallTriad: getTriadAt(0),
        for2ndCallTriad: getTriadAt(1),
        forCalls3rdTo254thTriad: zeroLeavesTriad,
        for255thCallTriad: getTriadAt(254),
        for256thCallTriad: getTriadAt(255),
        for257thCallTriad: getTriadAt(256),
        for258thCallTriad: getTriadAt(257),
        forCalls258thTo510thTriad: zeroLeavesTriad,
        for511thCallTriad: getTriadAt(510),
        for512thCallTriad: getTriadAt(511),
    },
    // TODO: calculate correct roots after refactoring of "fake insertion"
    // !!! The following roots are incorrect Merkle roots.
    // These roots are returned by the `MockTriadIncrementalMerkleTrees` contract
    // for this test-suite.
    // The code of the test-suite uses "fake" insertions of leaves. But the smart
    // contract can't calculate roots correctly after "fake" insertions.
    roots: {
        after1stCallRoot:
            '0x0cf1bd613b64b20a77f4d625296451f5f2600615560a4caa3b2c7c418c56787f',
        after2ndCallRoot:
            '0x19b2d668d60e341944c345863d8a6fb01e9f763a71db0a30d2db863a7ff853f5',
        after255thCallRoot:
            '0x087a86bf423519ffdba55ffea55d3f8739739dd6b3093e46eea3652ed5626199',
        after256thCallRoot:
            '0x15324ee1b21cca5675c6331c9f41fddae4b8e987ec717fa14c0cebf7bcd77722',
        after257thCallRoot:
            '0x1ace98ffec6c60fbd89b28b6199446afbdcbce2ed48a7a2106c0ca2928412486',
        after258thCallRoot:
            '0x0c3f820c34ff5358fcffc2fe6b393b64242e2c6c37c4e87a14ea08caefa4e9de',
        after511thCallRoot:
            '0x0af8d80c2c1f482970d065ba8d5e1a1a2b00b3adb11af7d90d2462127ef9b173',
        after512thCallRoot:
            '0x0f7d9e87507fa0cd0ebbb28ac18d654818210054688f5149694825bbd45a318c',
    },
};

export const dataForTreeChangeTest = {
    triads: {
        forFirst16382CallsTriad: zeroLeavesTriad,
        for16383thCallTriad: getTriadAt(16382),
        for16384thCallTriad: getTriadAt(16383),
        forMore16382CallsTriad: zeroLeavesTriad,
        for32767thCallTriad: getTriadAt(32766),
        for32768thCallTriad: getTriadAt(32767),
    },
    // TODO: calculate correct roots after refactoring of "fake insertion"
    // !!! The following roots are incorrect Merkle roots.
    // These roots are returned by the `MockTriadIncrementalMerkleTrees` contract
    // for this test-suite.
    // The code of the test-suite uses "fake" insertions of leaves. But the smart
    // contract can't calculate roots correctly after "fake" insertions.
    roots: {
        after16383thTriadFirstTreeRoot:
            '0x078ee0e2f31767c029eac1e7f69cb7d8b5489fc301a5af52a48a9804ed2a598f',
        after16384thTriadFirstTreeRoot:
            '0x1bb6b3e461afe8cf652f110070c7b5786a51e25a5f6a879fd0be15b355499fde',
        after32767thTriadSecondTreeRoot:
            '0x2da0a3a671e20f5d532d62359d8ea95878a3bece613199f1f4c622613d3b21e7',
        after32768thTriadSecondTreeRoot:
            '0x0102c7f852f40b58b5a8dc70f0a4e23e767f564f3f5aa6f08617cdd62be6f7d4',
    },
};
