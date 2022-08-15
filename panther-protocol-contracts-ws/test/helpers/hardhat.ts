// @ts-ignore
import { ethers } from 'hardhat';

import {
    getPoseidonT3Contract,
    getPoseidonT4Contract,
    getPoseidonT6Contract,
} from '../../lib/poseidonBuilder';

const provider = ethers.provider;

// If a test suite alter chain time (with `mineBlock` or `increaseTime`)
// consider taking a chain snapshot (with `takeSnapshot`) before tests and
// reverting to the snapshot taken (with revertSnapshot) after tests

export const mineBlock = async (timestamp?: number) => {
    await provider.send('evm_mine', timestamp ? [timestamp] : []);
    return provider.getBlock('latest');
};

export const increaseTime = async (seconds: number) => {
    await provider.send('evm_increaseTime', [seconds]);
};

export const takeSnapshot = async (): Promise<number> => {
    return await provider.send('evm_snapshot', []);
};

export const revertSnapshot = async (id: number) => {
    await provider.send('evm_revert', [id]);
};

export async function getBlockTimestamp(block?: number | 'latest') {
    return (await provider.getBlock(block || 'latest')).timestamp;
}

export async function deployPoseidon_T3_T4_T6() {
    const PoseidonT3 = await getPoseidonT3Contract();
    const poseidonT3 = await PoseidonT3.deploy();
    await poseidonT3.deployed();

    const PoseidonT4 = await getPoseidonT4Contract();
    const poseidonT4 = await PoseidonT4.deploy();
    await poseidonT4.deployed();

    const PoseidonT6 = await getPoseidonT6Contract();
    const poseidonT6 = await PoseidonT6.deploy();
    await poseidonT6.deployed();

    return [
        poseidonT3.address,
        poseidonT4.address,
        poseidonT6.address,
    ] as const;
}

export async function getPantherPoolMocFactoryByName(name: string) {
    const PoseidonT3 = await getPoseidonT3Contract();
    const poseidonT3 = await PoseidonT3.deploy();
    await poseidonT3.deployed();

    const PoseidonT4 = await getPoseidonT4Contract();
    const poseidonT4 = await PoseidonT4.deploy();
    await poseidonT4.deployed();

    const PoseidonT6 = await getPoseidonT6Contract();
    const poseidonT6 = await PoseidonT6.deploy();
    await poseidonT6.deployed();

    // Link external contracts
    // @ts-ignore
    const PantherPoolV0 = await ethers.getContractFactory(name, {
        libraries: {
            PoseidonT3: poseidonT3.address,
            PoseidonT4: poseidonT4.address,
            PoseidonT6: poseidonT6.address,
        },
    });
    return PantherPoolV0;
}
