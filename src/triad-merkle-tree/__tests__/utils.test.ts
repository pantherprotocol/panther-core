import {describe, expect} from '@jest/globals';

import CONSTANTS from '../constants';
import {TriadMerkleTree} from '..';
import Utils from '../utils';
import {fourthTree} from './data/trees';

describe('Generation, loading and compression of the Triad Merkle tree', () => {
    let tree: TriadMerkleTree;
    beforeAll(() => {
        const commitments = new Array<string>(CONSTANTS.TREE_SIZE);
        for (let i = 0; i < CONSTANTS.TREE_SIZE; i++) {
            commitments[i] = '0x' + BigInt(i).toString(16);
        }

        tree = Utils.createTriadMerkleTree(
            CONSTANTS.TREE_DEPTH,
            commitments,
            BigInt(0),
        );
    });

    it('should generate correct tree from 1536 commitments of 32 bytes hashes', () => {
        expect('0x' + BigInt(tree.root).toString(16)).toBe(fourthTree.root);
    });

    it('shoud be saved and loaded without compression', () => {
        const path = 'src/triad-merkle-tree/__tests__/data/tree_zip.txt';
        tree.save(path, false);
        const t = TriadMerkleTree.load(path, false);
        expect('0x' + BigInt(t.root).toString(16)).toBe(fourthTree.root);
    });

    it('should be saved and loaded with compression', () => {
        const path = 'src/triad-merkle-tree/__tests__/data/tree_zip.txt';
        tree.save(path, true);
        const t = TriadMerkleTree.load(path, true);
        expect('0x' + BigInt(t.root).toString(16)).toBe(fourthTree.root);
    });

    it('compression and decompression should give the same result', () => {
        const w = Math.random().toString(16).slice(2, 10);
        const c = Utils.compressString(w);
        const r = Utils.decompressString(c);
        expect(r).toBe(w);
    });
});
