// SPDX-License-Identifier: MIT
import { expect } from 'chai';

// @ts-ignore
import { toBytes32, PathElementsType, Triad, Pair } from '../lib/utilities';
import { takeSnapshot, revertSnapshot } from './helpers/hardhat';
import { MockPantherPoolV0 } from '../types';
import { poseidon, babyjub } from 'circomlibjs';
import { TriadMerkleTree } from '../lib/tree';
import assert from 'assert';
import { BytesLike } from 'ethers/lib/ethers';
import {
    bigIntToBuffer32,
    buffer32ToBigInt,
    RecipientTransaction,
    SenderTransaction,
    checkFn
} from '../lib/message-encryption';

import crypto from 'crypto';
import { BigNumber, utils } from 'ethers';
import { bigintToBytes32 } from '../lib/conversions';
import {
    deriveKeypairFromSeed,
    generateRandomBabyJubValue,
    multiplyScalars,
} from '../lib/keychain';

// ('../lib/keychain');
import { MockPantherPoolV0AndVaultIntegration } from '../types';
import { deployMockPantherPoolV0AndVaultIntegration } from './helpers/mockPantherPoolV0AndVaultIntegration';

describe('PantherPoolV0 and Vault Integration', () => {
    let poolV0: MockPantherPoolV0AndVaultIntegration;
    let snapshot: number;

    before(async () => {
        poolV0 = await deployMockPantherPoolV0AndVaultIntegration();
    });

    describe('Test GenerateDeposits & Exit', () => {
        before(async () => {
            snapshot = await takeSnapshot();
        });

        after(async () => {
            await revertSnapshot(snapshot);
        });

        const poseidon2or3 = (inputs: bigint[]): bigint => {
            assert(inputs.length === 3 || inputs.length === 2);
            return poseidon(inputs);
        };

        const PANTHER_CORE_ZERO_VALUE = BigInt(
            '2896678800030780677881716886212119387589061708732637213728415628433288554509',
        );
        const PANTHER_CORE_TREE_DEPTH_SIZE = 15;

        let tree = new TriadMerkleTree(
            PANTHER_CORE_TREE_DEPTH_SIZE,
            PANTHER_CORE_ZERO_VALUE,
            poseidon2or3,
        );

        describe('GenerateDeposits -> Exit - Integration test', function () {
            // [0] - Spender side generation - one time - Root public key will be shared
            const spenderSeed = BigInt('0xAABBCCDDEEFF');
            const spenderRootKeys = deriveKeypairFromSeed(spenderSeed);
            // [1] - Sender side generation - for every new tx
            const tx = new SenderTransaction(spenderRootKeys.publicKey);
            // [2] - Encrypt ( can throw ... )
            tx.encryptMessageV1();
            // [3] - Pack & Serialize - after this step data can be sent on chain
            tx.packCipheredText(); // tx.cipheredTextMessageV1 will be used as secret to be sent on chain
            // [4] - Send on-chain -> extract event etc ...
            // ///////////////////////////////////////////// SEND ON CHAIN /////////////////////////////////////////////
            const txIn = new RecipientTransaction(spenderRootKeys);
            // [5] - Deserialize --- we actually will first get this text from chain
            txIn.unpackMessageV1(tx.cipheredTextMessageV1);
            // [6] - Decrypt ( try... )
            try {
                txIn.decryptMessageV1();
            } catch (e) {
                // can't decrypt - this message is not for us
            }
            // [7] - Extract random ( try ... )
            try {
                txIn.unpackRandomAndCheckProlog();
            } catch (e) {
                // prolog is not equal to expected
            }
            // [8] - We ready to use random in spend flow
            it('Sent random is equal to received random', () => {
                expect(txIn.spenderRandom).equal(tx.spenderRandom);
            });
        });

        describe('Key Generation Loop Test - Long test', function () {
            for (let i = 0; i < 2; ++i) {
                // [0] - Spender side generation - one time - Root public key will be shared
                const spenderSeed = BigInt('0xAABBCCDDEEFF');
                const spenderRootKeys = deriveKeypairFromSeed(spenderSeed);
                // [1] - Sender side generation - for every new tx
                const senderTransaction = new SenderTransaction(spenderRootKeys.publicKey);
                // [2] - Encrypt ( can throw ... )
                senderTransaction.encryptMessageV1();
                // [3] - Pack & Serialize - after this step data can be sent on chain
                senderTransaction.packCipheredText(); // tx.cipheredTextMessageV1 will be used as secret to be sent on chain
                // [4] - Send on-chain -> extract event etc ...
                // ///////////////////////////////////////////// SEND ON CHAIN /////////////////////////////////////////////
                const recipientTransaction = new RecipientTransaction(spenderRootKeys);
                // [5] - Deserialize --- we actually will first get this text from chain
                recipientTransaction.unpackMessageV1(senderTransaction.cipheredTextMessageV1);
                // [6] - Decrypt ( try... )
                try {
                    recipientTransaction.decryptMessageV1();
                } catch (e) {
                    // can't decrypt - this message is not for us
                }
                // [7] - Extract random ( try ... )
                try {
                    recipientTransaction.unpackRandomAndCheckProlog();
                } catch (e) {
                    // prolog is not equal to expected
                }
                // [8] - We ready to use random in spend flow
                if (recipientTransaction.spenderRandom != senderTransaction.spenderRandom) {
                    // checkFn();
                    console.log(
                        'Double convert:',
                        buffer32ToBigInt(bigIntToBuffer32(senderTransaction.spenderRandom)),
                    );
                    console.log('Initial value:', senderTransaction.spenderRandom);
                    console.log('Extracted value:', recipientTransaction.spenderRandom);

                    console.log('Tx-OUT:', senderTransaction);
                    console.log('Tx-IN:', recipientTransaction);
                }
                it('Sent random is equal to received random', () => {
                    expect(recipientTransaction.spenderRandom).equal(senderTransaction.spenderRandom);
                });
            }
        });
    });
});
