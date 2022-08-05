// @ts-ignore
import { ethers } from 'hardhat';
import {
    getPoseidonT3Contract,
    getPoseidonT4Contract,
    getPoseidonT6Contract,
} from '../../lib/poseidonBuilder';
import { PantherPoolV0AndZAssetRegistryTester } from '../../types';

export { deployPantherPoolV0AndZAssetRegistryTester };

async function deployPantherPoolV0AndZAssetRegistryTester(): Promise<PantherPoolV0AndZAssetRegistryTester> {
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
    const PantherPoolV0 = await ethers.getContractFactory(
        'PantherPoolV0AndZAssetRegistryTester',
        {
            libraries: {
                PoseidonT3: poseidonT3.address,
                PoseidonT4: poseidonT4.address,
                PoseidonT6: poseidonT6.address,
            },
        },
    );

    return (await (
        await PantherPoolV0.deploy()
    ).deployed()) as PantherPoolV0AndZAssetRegistryTester;
}
