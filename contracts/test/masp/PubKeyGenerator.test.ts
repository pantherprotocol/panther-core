// SPDX-License-Identifier: MIT
import {expect} from 'chai';
// @ts-ignore
import {ethers} from 'hardhat';

describe('PubKeyGenerator contract', function () {
    let pkGenerator;

    before(async function () {
        const MockPubKeyGenerator = await ethers.getContractFactory(
            'MockPubKeyGenerator',
        );
        pkGenerator = await MockPubKeyGenerator.deploy();
    });

    describe('internal generatePubSpendingKey function', () => {
        it('shall return expected pubKey for given privKey #1', async () => {
            const privSpendKey =
                '1199578988755671961762930147238500713157617399963767731729709572022910026830';
            const pubSpendKey =
                await pkGenerator.internalGeneratePubSpendingKey(privSpendKey);
            expect(pubSpendKey.x).to.be.eq(
                '0x0f80e7fd7f708a19cc9605e4879b7af820f46004834227769b49f908c5cd00b0',
            );
            expect(pubSpendKey.y).to.be.eq(
                '0x1d9ef39b27db435dcbf3bb6b14a78d3680bcf13fced6caae4b896e0cc8244f11',
            );
        });
    });
});
