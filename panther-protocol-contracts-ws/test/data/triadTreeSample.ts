// SPDX-License-Identifier: MIT
import { toBytes32, Triad } from '../../lib/utilities';

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
