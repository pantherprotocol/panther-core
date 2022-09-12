// SPDX-License-Identifier: MIT
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { BigNumber } from 'ethers';

import {
    getPoseidonT3Contract,
    getPoseidonT4Contract,
} from '../../lib/poseidonBuilder';

import { toBytes32 } from '../../lib/utilities';

function printProgress(progress) {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(progress);
}

describe('TriadIncrementalMerkleTree: Multiple Trees', () => {
    if (isToBeSkipped()) return;

    // @ts-ignore
    let trees: ethers.Contract;
    let TriadIncrementalMerkleTrees;

    before(async () => {
        const PoseidonT3 = await getPoseidonT3Contract();
        const poseidonT3 = await PoseidonT3.deploy();
        await poseidonT3.deployed();

        const PoseidonT4 = await getPoseidonT4Contract();
        const poseidonT4 = await PoseidonT4.deploy();
        await poseidonT4.deployed();

        // Link Poseidon contracts
        // @ts-ignore
        TriadIncrementalMerkleTrees = await ethers.getContractFactory(
            'MockTriadIncrementalMerkleTrees',
            {
                libraries: {
                    PoseidonT3: poseidonT3.address,
                    PoseidonT4: poseidonT4.address,
                },
            },
        );

        trees = await TriadIncrementalMerkleTrees.deploy();
        await trees.deployed();
    });

    describe('Multiple trees', function () {
        it('Is able to insert 32768 triad batches', async () => {
            let i = 1;
            const getTriad = () => [
                toBytes32(i++),
                toBytes32(i++),
                toBytes32(i++),
            ];
            for (let c = 0; c < 32768; c++) {
                await trees.internalInsertBatch(getTriad());
                printProgress(`Inserting triad batch ${c}/32768`);
            }
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
        });

        it('should have 98304 leaves inserted', async () => {
            const leavesSum = (await trees.leavesNum()).toString();
            expect(leavesSum).to.equal('98304');
        });

        it('should "know" the correct root of the 1st tree', async () => {
            const finalRoots0 = await trees.finalRoots(0);
            expect(finalRoots0).to.equal(
                '0x0a6a3883732c35d7d21248d989d924704b4f535472bdb59c76f44e1a80ffa197',
            );
        });

        it('should "know" the correct root of the 2nd tree', async () => {
            const finalRoots1 = await trees.finalRoots(1);
            expect(finalRoots1).to.equal(
                '0x0b0869ab8f9824349e2f791be1220deb89b97d2dc2258930b23d4c8d1c15f5bb',
            );
        });

        it('should have "final" roots of trees emitted', async () => {
            const events = await trees.queryFilter('AnchoredRoot');

            // AnchoredRoot event 0
            const eventArgs0 = events[0].args;
            const eventArgs0Expectation = {
                treeId: BigNumber.from('0x00'),
                root: '0x0a6a3883732c35d7d21248d989d924704b4f535472bdb59c76f44e1a80ffa197',
            };
            expect(eventArgs0.treeId).to.equal(eventArgs0Expectation.treeId);
            expect(eventArgs0.root).to.equal(eventArgs0Expectation.root);

            // AnchoredRoot event 1
            const eventArgs1 = events[1].args;
            const eventArgs1Expectation = {
                treeId: BigNumber.from('0x01'),
                root: '0x0b0869ab8f9824349e2f791be1220deb89b97d2dc2258930b23d4c8d1c15f5bb',
            };
            expect(eventArgs1.treeId).to.equal(eventArgs1Expectation.treeId);
            expect(eventArgs1.root).to.equal(eventArgs1Expectation.root);
        });
        it('should have "interim" roots of the last tree cached', async () => {
            const cEvents = await trees.queryFilter('CachedRoot');

            // CachedRoot event 510
            const eventArgs510 = cEvents[510].args;
            const eventArgs510Expectation = {
                treeId: BigNumber.from('0x00'),
                root: '0x002f56fb4ff7c01456ab361e556e3207f1ede0317e8365e63e3f4e3065d5b537',
            };
            expect(eventArgs510.treeId).to.equal(
                eventArgs510Expectation.treeId,
            );
            expect(eventArgs510.root).to.equal(eventArgs510Expectation.root);

            // CachedRoot event 511
            const eventArgs511 = cEvents[511].args;
            const eventArgs511Expectation = {
                treeId: BigNumber.from('0x00'),
                root: '0x02702f6b150f9d7494a488f170893a896cd50d18a7b390017d35bb5ab310a27b',
            };
            expect(eventArgs511.treeId).to.equal(
                eventArgs511Expectation.treeId,
            );
            expect(eventArgs511.root).to.equal(eventArgs511Expectation.root);

            // CachedRoot event 16384
            const eventArgs16384 = cEvents[16384].args;
            const eventArgs16384Expectation = {
                treeId: BigNumber.from('0x01'),
                root: '0x0a6b9134b2450ed2496070baf9c96b5375e4d047da19dbe81d8b2bcff11718e4',
            };
            expect(eventArgs16384.treeId).to.equal(
                eventArgs16384Expectation.treeId,
            );
            expect(eventArgs16384.root).to.equal(
                eventArgs16384Expectation.root,
            );
        });
        it('should not have more than 32768 cached events', async () => {
            const cEvents = await trees.queryFilter('CachedRoot');
            expect(() => cEvents[32766].args).to.throw();
        });
    });
});

function isToBeSkipped(): boolean {
    if (!process.env.RUN_LONG_TESTS) {
        console.log(
            `Skipped by default.\n` +
                'Run it with `export RUN_LONG_TESTS=yes` or via `yarn test:long`',
        );
        return true;
    }
    console.log('Running long tests');
    return false;
}
