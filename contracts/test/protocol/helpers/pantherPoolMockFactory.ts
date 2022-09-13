// @ts-ignore
import {ethers} from 'hardhat';

import {
    getPoseidonT3Contract,
    getPoseidonT4Contract,
    getPoseidonT6Contract,
} from '../../../lib/poseidonBuilder';

export async function getPantherPoolMocFactoryByName(name: string) {
    // Deploy Poseidon hash contracts
    const [pT3, pT4, pT6] = await deployPoseidon_T3_T4_T6();

    // Link external contracts
    // @ts-ignore
    const PantherPoolV0 = await ethers.getContractFactory(name, {
        libraries: {
            PoseidonT3: pT3,
            PoseidonT4: pT4,
            PoseidonT6: pT6,
        },
    });
    return PantherPoolV0;
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
