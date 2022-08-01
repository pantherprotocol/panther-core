import {
    compressString,
    createTriadMerkleTree,
    decompressString,
    readCommitmentsFromCommitmentLog,
} from '../utils';
import {describe, expect} from '@jest/globals';

import {TriadMerkleTree} from '..';
import {fourthTree} from './data/trees';

const TREE_SIZE = 1536;
const TREE_DEPTH = 10;

describe('Generation, loading and compression of the Triad Merkle tree', () => {
    let tree: TriadMerkleTree;
    beforeAll(() => {
        const commitments = new Array<string>(TREE_SIZE);
        for (let i = 0; i < TREE_SIZE; i++) {
            commitments[i] = '0x' + BigInt(i).toString(16);
        }

        tree = createTriadMerkleTree(TREE_DEPTH, commitments, BigInt(0));
    });

    it('should generate correct tree from 1536 commitments of 32 bytes hashes', () => {
        expect('0x' + BigInt(tree.root).toString(16)).toBe(fourthTree.root);
    });

    it('shoud be saved and loaded without compression', () => {
        const path = 'src/triad-merkle-tree/__tests__/data/tree_zip.txt';
        tree.save(path, false);
        const t = TriadMerkleTree.loadFromFile(path, false);
        expect('0x' + BigInt(t.root).toString(16)).toBe(fourthTree.root);
    });

    it('should be saved and loaded with compression', () => {
        const path = 'src/triad-merkle-tree/__tests__/data/tree_zip.txt';
        tree.save(path, true);
        const t = TriadMerkleTree.loadFromFile(path, true);
        expect('0x' + BigInt(t.root).toString(16)).toBe(fourthTree.root);
    });

    it('compression and decompression should give the same result', () => {
        const w = Math.random().toString(16).slice(2, 10);
        const c = compressString(w);
        const r = decompressString(c);
        expect(r).toBe(w);
    });
});

describe('Reading, writing input files', () => {
    describe('JSON of NewCommitmentsLog[] events', () => {
        let commitments: string[];

        beforeAll(() => {
            const path =
                'src/triad-merkle-tree/__tests__/data/commitmentsLog-test-data.json';
            commitments = readCommitmentsFromCommitmentLog(path);
        });

        it('should get 21 commitments', () => {
            expect(commitments.length).toEqual(21);
        });

        it('should have correct commitments in correct order', () => {
            expect(commitments).toEqual([
                '0x07e2e7dba213522d226a2ea406f431f3266aed6e5efaf18d55a99d0f6082ddb7',
                '0x286cb3899960534923aa60f96fb89ea769ffae1948cc75a5f27e8af5ecfb49e3',
                '0x0667764c376602b72ef22218e1673c2cc8546201f9a77807570b3e5de137680d',
                '0x0204fee39297355746f20e0a1d3917c41161e86c38b53fdd743c2037e497be90',
                '0x0c7f821433d439df1e59b6263bca70734798562bfa83cce3d1da950e5a7e1d46',
                '0x0667764c376602b72ef22218e1673c2cc8546201f9a77807570b3e5de137680d',
                '0x06ed8e7337bc9e1d8a72c64d6dd9c168a2fdcb5dee789c82beb6b171532d48aa',
                '0x2da6371e0a5ad9cefa46557475b9f1c8ee562720530fe6e892e9fde40cca8638',
                '0x0667764c376602b72ef22218e1673c2cc8546201f9a77807570b3e5de137680d',
                '0x17b7bae0e940bd15ae2b701f558714e7f7cbacd85d412166d1a5a1f913da77b5',
                '0x0d5b9587a65e2a75aa8eb8c242fdd1f6b332df14df40c772b5188093f41be94b',
                '0x0667764c376602b72ef22218e1673c2cc8546201f9a77807570b3e5de137680d',
                '0x2d46fe4a7561a373c914524fe67f7fa3ef23b101dac3c3d284a41821e87d2682',
                '0x167c64750b418c3bc07324e3c9998f84ca14425bac4affa425663d1aef831560',
                '0x0667764c376602b72ef22218e1673c2cc8546201f9a77807570b3e5de137680d',
                '0x10a69bff1ef4002c683934c9394142b3d9073e90da2779be41a457824fd38328',
                '0x2141f3fd89d71e1b817978dfff2536a8cf4cd4d7eef2f13d73c67148854f381c',
                '0x0667764c376602b72ef22218e1673c2cc8546201f9a77807570b3e5de137680d',
                '0x2540afd6db18bc09cf702ec4644dc4d6a07b4950ffd3a78795488723913d0c5c',
                '0x28abaa386cf04e365d93f79a7807a391d69f18db0e8ea8e45698a527bf28225b',
                '0x0667764c376602b72ef22218e1673c2cc8546201f9a77807570b3e5de137680d',
            ]);
        });
    });
});
