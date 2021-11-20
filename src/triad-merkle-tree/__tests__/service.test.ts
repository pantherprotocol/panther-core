import { describe, expect } from '@jest/globals';

import Service from '../service'
import { fourthTree } from './data/trees';

describe('Generation of the Triad Merkle tree', () => {
    it('should generate correct tree from 1536 commitments of 32 bytes hashes', () => {
        const commitments = new Array<string>(1536);
        for (let i = 0; i < 1536; i++) {
            commitments[i] = '0x' + BigInt(i).toString(16);
        }

        const tree = Service.createTriadMerkleTree(commitments);
        expect('0x' + BigInt(tree.root).toString(16)).toBe(fourthTree.root);
    })





})