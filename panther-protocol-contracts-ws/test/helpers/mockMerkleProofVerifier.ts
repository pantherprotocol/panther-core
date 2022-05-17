// @ts-ignore
import { ethers } from 'hardhat';
import {
    getPoseidonT3Contract,
    getPoseidonT4Contract,
} from '../../lib/poseidonBuilder';
import { MockMerkleProofVerifier } from '../../types';

export { deployMockMerkleProofVerifier };

async function deployMockMerkleProofVerifier(): Promise<MockMerkleProofVerifier> {
    const PoseidonT3 = await getPoseidonT3Contract();
    const poseidonT3 = await PoseidonT3.deploy();
    await poseidonT3.deployed();

    const PoseidonT4 = await getPoseidonT4Contract();
    const poseidonT4 = await PoseidonT4.deploy();
    await poseidonT4.deployed();

    const BabyJubJubLib = await ethers.getContractFactory('BabyJubJub');
    const babyJubJub = await BabyJubJubLib.deploy();
    await babyJubJub.deployed();
    // Link Poseidon contracts
    // @ts-ignore
    const MerkleProofVerifier = await ethers.getContractFactory(
        'MockMerkleProofVerifier',
        {
            libraries: {
                PoseidonT3: poseidonT3.address,
                PoseidonT4: poseidonT4.address,
                BabyJubJub: babyJubJub.address,
            },
        },
    );

    return (
        await MerkleProofVerifier.deploy()
    ).deployed() as Promise<MockMerkleProofVerifier>;
}
