// SPDX-License-Identifier: MIT
import {expect} from 'chai';

import {
    getPoseidonT3Contract,
    getPoseidonT4Contract,
} from '../../lib/poseidonBuilder';
import {toBigNum, toBytes32, zeroLeaf} from '../../lib/utilities';

describe('PoseidonT3 contract', function () {
    let contract;

    before(async function () {
        const PoseidonT3 = await getPoseidonT3Contract();
        contract = await PoseidonT3.deploy();
        await contract.deployed();
    });

    it('checks constrain reference implementation poseidonperm_x5_254_3', async () => {
        expect(
            toBigNum(await contract.poseidon([toBytes32(1), toBytes32(2)])),
        ).to.equal(
            toBigNum(
                '0x115cc0f5e7d690413df64c6b9662e9cf2a3617f2743245519e19607a4417189a',
            ),
        );
    });

    it('computes correct poseidon for case #1', async function () {
        expect(
            toBigNum(await contract.poseidon([zeroLeaf, zeroLeaf])),
        ).to.equal(
            '15915358021544645824948763611506574620607002248967455613245207713011512736724',
        );
    });

    it('computes correct poseidon for case #2', async function () {
        const twoZeros = toBytes32(
            '15915358021544645824948763611506574620607002248967455613245207713011512736724',
        );
        expect(
            toBigNum(await contract.poseidon([twoZeros, twoZeros])),
        ).to.equal(
            '3378776220260879286502089033253596247983977280165117209776494090180287943112',
        );
    });

    it('computes correct poseidon for case #3', async function () {
        const fourZeros = toBytes32(
            '3378776220260879286502089033253596247983977280165117209776494090180287943112',
        );
        expect(
            toBigNum(await contract.poseidon([fourZeros, fourZeros])),
        ).to.equal(
            '13332607562825133358947880930907706925768730553195841232963500270946125500492',
        );
    });

    it('compute correct poseidon for case #4', async function () {
        const eightZeros = toBytes32(
            '13332607562825133358947880930907706925768730553195841232963500270946125500492',
        );
        expect(
            toBigNum(await contract.poseidon([eightZeros, eightZeros])),
        ).to.equal(
            '2602133270707827583410190225239044634523625207877234879733211246465561970688',
        );
    });
});

describe('PoseidonT4 contract', function () {
    let contract;

    before(async function () {
        const PoseidonT4 = await getPoseidonT4Contract();
        contract = await PoseidonT4.deploy();
        await contract.deployed();
    });

    it('computes correct poseidon for case #1', async function () {
        expect(
            toBigNum(await contract.poseidon([zeroLeaf, zeroLeaf, zeroLeaf])),
        ).to.equal(
            '0x1be18cd72ac1586de27dd60eba90654bd54383004991951bccb0f6bad02c67f6',
        );
    });
});
