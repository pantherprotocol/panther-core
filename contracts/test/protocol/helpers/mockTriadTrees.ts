// @ts-ignore
import {ethers} from 'hardhat';

import {
    getPoseidonT3Contract,
    getPoseidonT4Contract,
} from '../../../lib/poseidonBuilder';
import {MockTriadIncrementalMerkleTrees} from '../../../types/contracts';

export {deployMockTrees};

async function deployMockTrees(): Promise<MockTriadIncrementalMerkleTrees> {
    const PoseidonT3 = await getPoseidonT3Contract();
    const poseidonT3 = await PoseidonT3.deploy();
    await poseidonT3.deployed();

    const PoseidonT4 = await getPoseidonT4Contract();
    const poseidonT4 = await PoseidonT4.deploy();
    await poseidonT4.deployed();

    // Example of using library: DON'T REMOVE
    //const BabyJubJubLib = await ethers.getContractFactory('BabyJubJub');
    //const babyJubJub = await BabyJubJubLib.deploy();
    //await babyJubJub.deployed();
    // Link Poseidon contracts
    // @ts-ignore
    const TriadIncrementalMerkleTrees = await ethers.getContractFactory(
        'MockTriadIncrementalMerkleTrees',
        {
            libraries: {
                PoseidonT3: poseidonT3.address,
                PoseidonT4: poseidonT4.address,
            },
        },
    );

    return (
        await TriadIncrementalMerkleTrees.deploy()
    ).deployed() as Promise<MockTriadIncrementalMerkleTrees>;
}
