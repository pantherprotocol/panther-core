// SPDX-License-Identifier: MIT
// @ts-ignore
import { ethers } from 'hardhat';
import {
    createCode,
    generateABI,
} from 'circomlibjs/src/poseidon_gencontract.js';

const getPoseidonT3Contract = getPoseidonContract(2);
const getPoseidonT4Contract = getPoseidonContract(3);
const getPoseidonT6Contract = getPoseidonContract(5);
export { getPoseidonT3Contract, getPoseidonT4Contract, getPoseidonT6Contract };

function getPoseidonContract(n: number) {
    // @ts-ignore
    return async (): ethers.Contract => {
        const abi = generateABI(n);
        const expectedIface = getExpectedInterface(n);
        checkInterface(expectedIface, abi);

        // @ts-ignore
        const [deployer] = await ethers.getSigners();
        // @ts-ignore
        return new ethers.ContractFactory(
            [expectedIface],
            createCode(n),
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
            `${e.type}${e.name}(${e.inputs.map(
                (i: { type: string }): string => i.type,
            )})` +
            `${e.stateMutability}returns(${e.outputs.map(
                (o: { type: string }): string => o.type,
            )})`;

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
