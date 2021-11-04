// SPDX-License-Identifier: MIT
// @ts-ignore
import { ethers } from 'hardhat';

const poseidonGenContract = require('circomlibjs/src/poseidon_gencontract.js');

const getPoseidonT3Contract = getPoseidonContract(2);
const getPoseidonT4Contract = getPoseidonContract(3);
export { getPoseidonT3Contract, getPoseidonT4Contract };

function getPoseidonContract(n: number) {
    // @ts-ignore
    return async (): ethers.Contract => {
        const abi = poseidonGenContract.generateABI(n);
        const expectedIface = getExpectedInterface(n);
        checkInterface(expectedIface, abi);

        // @ts-ignore
        const [deployer] = await ethers.getSigners();
        // @ts-ignore
        return new ethers.ContractFactory(
            [expectedIface],
            poseidonGenContract.createCode(n),
            deployer,
        );
    };
}

function checkInterface(expectedIface: string, abi: any[]) {
    const index = abi.findIndex(e => {
        const expected = expectedIface
            .replace('memory', '')
            .replace('input', '')
            .replace('external', '')
            .replace(/ /g, '');
        const actual =
            `${e.type}${e.name}(${e.inputs.map(i => i.type)})` +
            `${e.stateMutability}returns(${e.outputs.map(o => o.type)})`;

        return expected == actual;
    });
    if (index < 0) throw new Error('unexpected ABI');
}

function getExpectedInterface(n: number): string {
    return (
        `function poseidon(bytes32[${n}] memory input)` +
        ' external pure returns (bytes32)'
    );
}
