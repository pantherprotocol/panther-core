// SPDX-License-Identifier: MIT
import assert from 'assert';

import type {BytesLike} from '@ethersproject/bytes';
import {deriveKeypairFromSeed} from '@panther-core/crypto/lib/base/keypairs';
import {
    bigIntToBuffer,
    uint8ArrayToBigInt,
} from '@panther-core/crypto/lib/utils/bigint-conversions';
import {expect} from 'chai';
// @ts-ignore
import {poseidon} from 'circomlibjs';
import {BigNumber} from 'ethers';

import {UtxoRecipientData, UtxoSenderData} from '../../lib/message-encryption';
import {MerkleProof, TriadMerkleTree} from '../../lib/tree';
import {Pair, PathElementsType, toBytes32} from '../../lib/utilities';
import {PantherPoolV0AndZAssetRegistryAndVaultTester} from '../../types/contracts';

import {getExitCommitment} from './data/depositAndFakeExitSample';
import {
    takeSnapshot,
    revertSnapshot,
    increaseTime,
    getBlockTimestamp,
} from './helpers/hardhat';
import {deployPantherPoolV0AndZAssetRegistryAndVaultTester} from './helpers/pantherPoolV0AndZAssetRegistryAndVaultTester';

describe('PantherPoolV0 and Vault Integration', () => {
    // eslint-disable-next-line no-unused-vars
    let pantherPoolV0AndZAssetRegistryAndVaultTester: PantherPoolV0AndZAssetRegistryAndVaultTester;
    let snapshot: number;
    const UTXOs = 3;
    const tokensAddresses = [BigInt(0), BigInt(0), BigInt(0)];
    const zAssetIds = [BigInt(0), BigInt(0), BigInt(0)];
    const amounts = [BigInt(1000), BigInt(1000), BigInt(1000)];

    before(async () => {
        pantherPoolV0AndZAssetRegistryAndVaultTester =
            await deployPantherPoolV0AndZAssetRegistryAndVaultTester();
        for (let i = 0; i < UTXOs; ++i) {
            const tokenAddress =
                await pantherPoolV0AndZAssetRegistryAndVaultTester.getTokenAddress(
                    i,
                );
            tokensAddresses[i] = BigInt(tokenAddress);
            const zAssetId =
                await pantherPoolV0AndZAssetRegistryAndVaultTester.testGetZAssetId(
                    BigNumber.from(tokensAddresses[i]),
                    0,
                );
            zAssetIds[i] = BigInt(zAssetId.toString());
        }
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

        // eslint-disable-next-line no-unused-vars
        const tree = new TriadMerkleTree(
            PANTHER_CORE_TREE_DEPTH_SIZE,
            PANTHER_CORE_ZERO_VALUE,
            poseidon2or3,
        );

        describe('GenerateDeposits -> Exit - Integration test', function () {
            // [0] - Spender side generation - one time - Root public key will be shared
            const rootSeed = BigInt('0xAABBCCDDEEFF');
            const readingSeed = BigInt('0xFFEEDDCCBBAA');
            const recipientRootKeys = deriveKeypairFromSeed(rootSeed);
            const recipientReadingKeys = deriveKeypairFromSeed(readingSeed);
            // [1] - Sender side generation - for every new tx
            const senderTransaction = new UtxoSenderData(
                recipientRootKeys.publicKey,
                recipientReadingKeys.publicKey,
            );
            // [2] - Encrypt ( can throw ... )
            senderTransaction.encryptMessageV1();
            // [3] - Pack & Serialize - after this step data can be sent on chain
            senderTransaction.packCipheredText(); // tx.cipheredTextMessageV1 will be used as secret to be sent on chain
            // [4] - Send on-chain -> extract event etc ...
            // ///////////////////////////////////////////// SEND ON CHAIN /////////////////////////////////////////////
            const recipientTransaction = new UtxoRecipientData(
                recipientReadingKeys,
            );
            // [5] - Deserialize --- we actually will first get this text from chain
            try {
                if (!senderTransaction.cipheredTextMessageV1)
                    throw new Error('Undefined ciphered text message V1');

                recipientTransaction.unpackMessageV1(
                    senderTransaction.cipheredTextMessageV1,
                );
            } catch (e: any) {
                throw Error("Can't unpack: " + e.toString());
            }
            // [6] - Decrypt ( try... )
            try {
                recipientTransaction.decryptMessageV1();
            } catch (e: any) {
                throw Error(
                    "can't decrypt - this message is not for us " +
                        e.toString(),
                );
            }
            // [7] - Extract random ( try ... )
            try {
                recipientTransaction.deriveRecipientSpendingKeysFromRootKeysAndRandom(
                    recipientRootKeys,
                );
            } catch (e: any) {
                // prolog is not equal to expected
            }
            // [8] - We ready to use random in spend flow
            it('Sent random is equal to received random', () => {
                expect(recipientTransaction.recipientRandom).equal(
                    senderTransaction.recipientRandom,
                );
            });
            // [9] - Double check sender derived public = recipient derived public key
            it('Sender derived pub-key is equal to recipient derived pub-key', () => {
                if (!recipientTransaction.recipientSpendingKeys) {
                    throw new Error('Undefined recipient spending keys');
                }
                if (
                    recipientTransaction.recipientSpendingKeys.publicKey[0] !=
                        senderTransaction.recipientPubKey[0] ||
                    recipientTransaction.recipientSpendingKeys.publicKey[1] !=
                        senderTransaction.recipientPubKey[1]
                ) {
                    console.log('Tx-OUT:', senderTransaction);
                    console.log('Tx-IN:', recipientTransaction);
                }
                expect(
                    recipientTransaction.recipientSpendingKeys.publicKey,
                ).deep.equal(senderTransaction.recipientPubKey);
            });

            it('Async ... calls', async () => {
                if (!senderTransaction.cipheredTextMessageV1) {
                    throw new Error('undefined ciphered text message V1');
                }
                if (!recipientTransaction.recipientSpendingKeys) {
                    throw new Error('undefined recipient spending keys');
                }
                const secrets = [
                    toBytes32(
                        uint8ArrayToBigInt(
                            senderTransaction.cipheredTextMessageV1.slice(
                                0,
                                32,
                            ),
                        ).toString(),
                    ),
                    toBytes32(
                        uint8ArrayToBigInt(
                            senderTransaction.cipheredTextMessageV1.slice(
                                32,
                                64,
                            ),
                        ).toString(),
                    ),
                ] as Pair;
                const createdAtNum = BigInt('1652375774');
                await pantherPoolV0AndZAssetRegistryAndVaultTester.generateDepositsExtended(
                    [amounts[0], amounts[1], amounts[2]],
                    [
                        BigNumber.from(senderTransaction.recipientPubKey[0]),
                        BigNumber.from(senderTransaction.recipientPubKey[1]),
                    ],
                    secrets,
                    createdAtNum,
                );

                // const createdAtNum = BigInt('1652375774');
                // const createdAtBytes32 = toBytes32(createdAtNum.toString());
                const commitments: BigNumber[] = [];
                commitments.fill(BigNumber.from(0), UTXOs);
                const commitmentsForTree: bigint[] = [];
                commitmentsForTree.fill(BigInt(0), UTXOs);
                for (let i = 0; i < UTXOs; ++i) {
                    commitments[i] =
                        await pantherPoolV0AndZAssetRegistryAndVaultTester.testGenerateCommitments(
                            BigNumber.from(
                                senderTransaction.recipientPubKey[0],
                            ),
                            BigNumber.from(
                                senderTransaction.recipientPubKey[1],
                            ),
                            amounts[i],
                            BigNumber.from(zAssetIds[i]),
                            createdAtNum,
                        );
                    commitmentsForTree[i] = BigInt(commitments[i].toString());
                    //console.log(' --- TEST VALUES ---');
                    //console.log(toBytes32(commitments[i].toString()));
                }

                tree.insertBatch(commitmentsForTree as bigint[]);
                const merkleProof: MerkleProof[] = [];
                for (let i = 0; i < UTXOs; ++i) {
                    merkleProof[i] = tree.genMerklePath(i);
                }

                const exitTime = (await getBlockTimestamp()) + 1;
                await pantherPoolV0AndZAssetRegistryAndVaultTester.testUpdateExitTimes(
                    exitTime,
                    100,
                );

                for (let i = 0; i < UTXOs; ++i) {
                    await pantherPoolV0AndZAssetRegistryAndVaultTester.commitToExit(
                        getExitCommitment(
                            recipientTransaction.recipientSpendingKeys.privateKey.toString(),
                            pantherPoolV0AndZAssetRegistryAndVaultTester.address,
                        ),
                    );
                    await increaseTime(101);
                    const leftLeafId = i;
                    await pantherPoolV0AndZAssetRegistryAndVaultTester.testExit(
                        await pantherPoolV0AndZAssetRegistryAndVaultTester.getTokenAddress(
                            i,
                        ),
                        0,
                        amounts[i],
                        createdAtNum,
                        recipientTransaction.recipientSpendingKeys
                            .privateKey as bigint,
                        leftLeafId,
                        ((): PathElementsType => {
                            const pathElements: BytesLike[] = [];
                            merkleProof[i].pathElements.forEach(
                                (value, index) => {
                                    pathElements.push(
                                        toBytes32(
                                            value[0].toString(),
                                        ) as BytesLike,
                                    );
                                    if (index == 0) {
                                        pathElements.push(
                                            toBytes32(value[1].toString()),
                                        );
                                    }
                                },
                            );
                            return pathElements as PathElementsType;
                        })(),
                        toBytes32(merkleProof[i].root.toString()),
                        0,
                    );
                }
                /*
                    const zAssetIdBuf = bigIntToBuffer32(zAssetIds[i]);
                    const amountBuf = bigIntToBuffer32(amounts[i]);
                    const merged = new Uint8Array([
                        ...zAssetIdBuf.slice(0, 20),
                        ...amountBuf.slice(0, 12).reverse(),
                    ]);
                    */
            });
        });

        describe('Key Generation Loop Test - Long test', function () {
            for (let i = 0; i < 2; ++i) {
                // [0] - Spender side generation - one time - Root public key will be shared
                const rootSeed = BigInt('0xAABBCCDDEEFF');
                const readingSeed = BigInt('0xFFEEDDCCBBAA');
                const recipientRootKeys = deriveKeypairFromSeed(rootSeed);
                const recipientReadingKeys = deriveKeypairFromSeed(readingSeed);
                // [1] - Sender side generation - for every new tx
                const senderTransaction = new UtxoSenderData(
                    recipientRootKeys.publicKey,
                    recipientReadingKeys.publicKey,
                );

                // [2] - Encrypt ( can throw ... )
                senderTransaction.encryptMessageV1();
                // [3] - Pack & Serialize - after this step data can be sent on chain
                senderTransaction.packCipheredText(); // tx.cipheredTextMessageV1 will be used as secret to be sent on chain
                // [4] - Send on-chain -> extract event etc ...
                // ///////////////////////////////////////////// SEND ON CHAIN /////////////////////////////////////////////
                const recipientTransaction = new UtxoRecipientData(
                    recipientReadingKeys,
                );
                if (!senderTransaction.cipheredTextMessageV1)
                    throw new Error('undefined ciphered text message V1');

                // [5] - Deserialize --- we actually will first get this text from chain
                recipientTransaction.unpackMessageV1(
                    senderTransaction.cipheredTextMessageV1,
                );
                // [6] - Decrypt ( try... )
                try {
                    recipientTransaction.decryptMessageV1();
                } catch (e) {
                    console.log("can't decrypt - this message is not for us");
                }
                // [7] - Extract random ( try ... )
                try {
                    recipientTransaction.deriveRecipientSpendingKeysFromRootKeysAndRandom(
                        recipientRootKeys,
                    );
                } catch (e) {
                    console.log('prolog is not equal to expected');
                }
                // [8] - We ready to use random in spend flow
                if (
                    recipientTransaction.recipientRandom !=
                    senderTransaction.recipientRandom
                ) {
                    console.log(
                        'Double convert:',
                        uint8ArrayToBigInt(
                            bigIntToBuffer(senderTransaction.recipientRandom),
                        ),
                    );
                    console.log(
                        'Initial value:',
                        senderTransaction.recipientRandom,
                    );
                    console.log(
                        'Extracted value:',
                        recipientTransaction.recipientRandom,
                    );

                    console.log('Tx-OUT:', senderTransaction);
                    console.log('Tx-IN:', recipientTransaction);
                }
                it('Sent random is equal to received random', () => {
                    expect(recipientTransaction.recipientRandom).equal(
                        senderTransaction.recipientRandom,
                    );
                });
            }
        });
    });
});
