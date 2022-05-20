// SPDX-License-Identifier: MIT
import { expect } from 'chai';

// @ts-ignore
import { takeSnapshot, revertSnapshot } from './helpers/hardhat';
import { poseidon } from 'circomlibjs';
import { MerkleProof, TriadMerkleTree } from '../lib/tree';
import assert from 'assert';
import {
    bigIntToBuffer32,
    buffer32ToBigInt,
    RecipientTransaction,
    SenderTransaction,
} from '../lib/message-encryption';

import { deriveKeypairFromSeed } from '../lib/keychain';

import { MockPantherPoolV0AndVaultIntegration } from '../types';
import { deployMockPantherPoolV0AndVaultIntegration } from './helpers/mockPantherPoolV0AndVaultIntegration';
import { PathElementsType, toBytes32, Triad } from '../lib/utilities';
// eslint-disable-next-line import/no-duplicates
import { BigNumber } from 'ethers';
// eslint-disable-next-line import/no-duplicates
import BytesLike from 'ethers';


describe('PantherPoolV0 and Vault Integration', () => {
    // eslint-disable-next-line no-unused-vars
    let mockPantherPoolV0AndVaultIntegration: MockPantherPoolV0AndVaultIntegration;
    let snapshot: number;
    const UTXOs = 3;
    let tokensAddresses: BigInt[] = [BigInt(0), BigInt(0), BigInt(0)];
    let zAssetIds: BigInt[] = [BigInt(0), BigInt(0), BigInt(0)];
    const amounts = [BigInt(1000), BigInt(1000), BigInt(1000)];

    before(async () => {
        mockPantherPoolV0AndVaultIntegration =
            await deployMockPantherPoolV0AndVaultIntegration();
        for (let i = 0; i < UTXOs; ++i) {
            let tokenAddress =
                await mockPantherPoolV0AndVaultIntegration.getTokenAddress(i);
            tokensAddresses[i] = BigInt(tokenAddress);
            let zAssetId =
                await mockPantherPoolV0AndVaultIntegration.testGetZAssetId(
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
            const senderTransaction = new SenderTransaction(
                spenderRootKeys.publicKey,
            );
            // [2] - Encrypt ( can throw ... )
            senderTransaction.encryptMessageV1();
            // [3] - Pack & Serialize - after this step data can be sent on chain
            senderTransaction.packCipheredText(); // tx.cipheredTextMessageV1 will be used as secret to be sent on chain
            // [4] - Send on-chain -> extract event etc ...
            // ///////////////////////////////////////////// SEND ON CHAIN /////////////////////////////////////////////
            const recipientTransaction = new RecipientTransaction(
                spenderRootKeys,
            );
            // [5] - Deserialize --- we actually will first get this text from chain
            recipientTransaction.unpackMessageV1(
                senderTransaction.cipheredTextMessageV1,
            );
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
            it('Sent random is equal to received random', () => {
                expect(recipientTransaction.spenderRandom).equal(
                    senderTransaction.spenderRandom,
                );
            });
            // [9] - Double check sender derived public = recipient derived public key
            it('Sender derived pub-key is equal to recipient derived pub-key', () => {
                if (
                    recipientTransaction.spenderKeys.publicKey[0] !=
                        senderTransaction.spenderPubKey[0] ||
                    recipientTransaction.spenderKeys.publicKey[1] !=
                        senderTransaction.spenderPubKey[1]
                ) {
                    console.log('Tx-OUT:', senderTransaction);
                    console.log('Tx-IN:', recipientTransaction);
                }
                expect(recipientTransaction.spenderKeys.publicKey).deep.equal(
                    senderTransaction.spenderPubKey,
                );
            });

            it('Async ... calls', async () => {
                const secrets = [
                    toBytes32(
                        buffer32ToBigInt(
                            senderTransaction.cipheredTextMessageV1.slice(
                                0,
                                32,
                            ),
                        ).toString(),
                    ),
                    toBytes32(
                        buffer32ToBigInt(
                            senderTransaction.cipheredTextMessageV1.slice(
                                32,
                                64,
                            ),
                        ).toString(),
                    ),
                    toBytes32(
                        buffer32ToBigInt(
                            senderTransaction.cipheredTextMessageV1.slice(
                                64,
                                96,
                            ),
                        ).toString(),
                    ),
                ] as Triad;
                const createdAtNum = BigInt('1652375774');
                await mockPantherPoolV0AndVaultIntegration.generateDepositsExtended(
                    [amounts[0], amounts[1], amounts[2]],
                    [
                        BigNumber.from(senderTransaction.spenderPubKey[0]),
                        BigNumber.from(senderTransaction.spenderPubKey[1]),
                    ],
                    secrets,
                    createdAtNum,
                );

                // const createdAtNum = BigInt('1652375774');
                // const createdAtBytes32 = toBytes32(createdAtNum.toString());
                let commitments: BigNumber[] = [];
                commitments.fill(BigNumber.from(0), UTXOs);
                let commitmentsForTree: BigInt[] = [];
                commitmentsForTree.fill(BigInt(0), UTXOs);
                for (let i = 0; i < UTXOs; ++i) {
                    commitments[i] =
                        await mockPantherPoolV0AndVaultIntegration.generateCommitments(
                            BigNumber.from(senderTransaction.spenderPubKey[0]),
                            BigNumber.from(senderTransaction.spenderPubKey[1]),
                            amounts[i],
                            BigNumber.from(zAssetIds[i]),
                            createdAtNum,
                        );
                    commitmentsForTree[i] = BigInt(commitments[i].toString());
                    console.log(' --- TEST VALUES ---');
                    console.log(toBytes32(commitments[i].toString()));
                }

                tree.insertBatch(commitmentsForTree as bigint[]);
                let merkleProof: MerkleProof[] = [];
                for (let i = 0; i < UTXOs; ++i) {
                    merkleProof[i] = tree.genMerklePath(i);
                }

                for (let i = 0; i < UTXOs; ++i) {
                    const pathElements = [
                        <BytesLike>(
                            toBytes32(
                                merkleProof[i].pathElements[0][0].toString(),
                            )
                        ),
                        <BytesLike>(
                            toBytes32(
                                merkleProof[i].pathElements[0][1].toString(),
                            )
                        ),
                        <BytesLike>(
                            toBytes32(
                                merkleProof[i].pathElements[1][0].toString(),
                            )
                        ),
                        <BytesLike>(
                            toBytes32(
                                merkleProof[i].pathElements[2][0].toString(),
                            )
                        ),
                        <BytesLike>(
                            toBytes32(
                                merkleProof[i].pathElements[3][0].toString(),
                            )
                        ),
                        <BytesLike>(
                            toBytes32(
                                merkleProof[i].pathElements[4][0].toString(),
                            )
                        ),
                        <BytesLike>(
                            toBytes32(
                                merkleProof[i].pathElements[5][0].toString(),
                            )
                        ),
                        <BytesLike>(
                            toBytes32(
                                merkleProof[i].pathElements[6][0].toString(),
                            )
                        ),
                        <BytesLike>(
                            toBytes32(
                                merkleProof[i].pathElements[7][0].toString(),
                            )
                        ),
                        <BytesLike>(
                            toBytes32(
                                merkleProof[i].pathElements[8][0].toString(),
                            )
                        ),
                        <BytesLike>(
                            toBytes32(
                                merkleProof[i].pathElements[9][0].toString(),
                            )
                        ),
                        <BytesLike>(
                            toBytes32(
                                merkleProof[i].pathElements[10][0].toString(),
                            )
                        ),
                        <BytesLike>(
                            toBytes32(
                                merkleProof[i].pathElements[11][0].toString(),
                            )
                        ),
                        <BytesLike>(
                            toBytes32(
                                merkleProof[i].pathElements[12][0].toString(),
                            )
                        ),
                        <BytesLike>(
                            toBytes32(
                                merkleProof[i].pathElements[13][0].toString(),
                            )
                        ),
                        <BytesLike>(
                            toBytes32(
                                merkleProof[i].pathElements[14][0].toString(),
                            )
                        ),
                    ] as PathElementsType;
                    //console.log( await mockPantherPoolV0AndVaultIntegration.getTokenAddress(i) );
                    //console.log( toBytes32(zAssetIds[i].toString()) );
                    const leftLeafId = i;
                    await mockPantherPoolV0AndVaultIntegration.testExit(
                        await mockPantherPoolV0AndVaultIntegration.getTokenAddress(
                            i,
                        ),
                        0,
                        amounts[i],
                        createdAtNum,
                        recipientTransaction.spenderKeys.privateKey as bigint,
                        leftLeafId,
                        pathElements,
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
                const spenderSeed = BigInt('0xAABBCCDDEEFF');
                const spenderRootKeys = deriveKeypairFromSeed(spenderSeed);
                // [1] - Sender side generation - for every new tx
                const senderTransaction = new SenderTransaction(
                    spenderRootKeys.publicKey,
                );
                // [2] - Encrypt ( can throw ... )
                senderTransaction.encryptMessageV1();
                // [3] - Pack & Serialize - after this step data can be sent on chain
                senderTransaction.packCipheredText(); // tx.cipheredTextMessageV1 will be used as secret to be sent on chain
                // [4] - Send on-chain -> extract event etc ...
                // ///////////////////////////////////////////// SEND ON CHAIN /////////////////////////////////////////////
                const recipientTransaction = new RecipientTransaction(
                    spenderRootKeys,
                );
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
                    recipientTransaction.unpackRandomAndCheckProlog();
                } catch (e) {
                    console.log('prolog is not equal to expected');
                }
                // [8] - We ready to use random in spend flow
                if (
                    recipientTransaction.spenderRandom !=
                    senderTransaction.spenderRandom
                ) {
                    console.log(
                        'Double convert:',
                        buffer32ToBigInt(
                            bigIntToBuffer32(senderTransaction.spenderRandom),
                        ),
                    );
                    console.log(
                        'Initial value:',
                        senderTransaction.spenderRandom,
                    );
                    console.log(
                        'Extracted value:',
                        recipientTransaction.spenderRandom,
                    );

                    console.log('Tx-OUT:', senderTransaction);
                    console.log('Tx-IN:', recipientTransaction);
                }
                it('Sent random is equal to received random', () => {
                    expect(recipientTransaction.spenderRandom).equal(
                        senderTransaction.spenderRandom,
                    );
                });
            }
        });
    });
});
