// @ts-ignore
import { ethers } from 'hardhat';
import {
    getPoseidonT3Contract,
    getPoseidonT4Contract,
} from '../../../lib/poseidonBuilder';
import { MerkleProofVerifierTester } from '../../../types';

export { deployMerkleProofVerifierTester };

async function deployMerkleProofVerifierTester(): Promise<MerkleProofVerifierTester> {
    const PoseidonT3 = await getPoseidonT3Contract();
    const poseidonT3 = await PoseidonT3.deploy();
    await poseidonT3.deployed();

    const PoseidonT4 = await getPoseidonT4Contract();
    const poseidonT4 = await PoseidonT4.deploy();
    await poseidonT4.deployed();

    // Link Poseidon contracts
    // @ts-ignore
    const MerkleProofVerifierTester = await ethers.getContractFactory(
        'MerkleProofVerifierTester',
        {
            libraries: {
                PoseidonT3: poseidonT3.address,
                PoseidonT4: poseidonT4.address,
            },
        },
    );

    return (
        await MerkleProofVerifierTester.deploy()
    ).deployed() as Promise<MerkleProofVerifierTester>;
}
