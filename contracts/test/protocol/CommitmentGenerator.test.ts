// SPDX-License-Identifier: MIT
import {expect} from 'chai';
import {deployMockCommitmentGenerator} from './helpers/mockCommitmentGenerator';
import {poseidon2or3} from '@panther-core/crypto/lib/other/triad-merkle-tree';
import {BigNumber} from 'ethers';

describe('CommitmentGenerator contract', function () {
    let cGenerator: any;

    before(async function () {
        cGenerator = await deployMockCommitmentGenerator();
    });

    describe('internal generateCommitment function', () => {
        it('shall return expected commitment for input #1', async () => {
            const commitment = poseidon2or3([
                BigInt(
                    '0x0f80e7fd7f708a19cc9605e4879b7af820f46004834227769b49f908c5cd00b0',
                ), // pubSpendKey.x
                BigInt(
                    '0x1d9ef39b27db435dcbf3bb6b14a78d3680bcf13fced6caae4b896e0cc8244f11',
                ), // pubSpendKey.y
                BigNumber.from('13368610476915271') // amount
                    .shl(192)
                    .or(
                        BigNumber.from(
                            '1374385896127056642578200266529209595973363230283', // zAssetId
                        ).shl(32),
                    )
                    .or(
                        BigNumber.from(1654703944), // creationTime
                    )
                    .toBigInt(),
            ]);
            expect(
                await cGenerator.internalGenerateCommitment(
                    '0x0f80e7fd7f708a19cc9605e4879b7af820f46004834227769b49f908c5cd00b0', // pubSpendKey.x
                    '0x1d9ef39b27db435dcbf3bb6b14a78d3680bcf13fced6caae4b896e0cc8244f11', // pubSpendKey.y
                    '13368610476915271', // amount
                    '1374385896127056642578200266529209595973363230283', // zAssetId
                    1654703944, // creationTime
                ),
            ).to.be.eq('0x' + commitment.toString(16));
        });
    });
});
