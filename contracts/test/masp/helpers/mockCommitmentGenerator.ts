// @ts-ignore
import {ethers} from 'hardhat';
import {getPoseidonT6Contract} from '../../../lib/poseidonBuilder';
import {MockCommitmentGenerator} from '../../../types/contracts';

export {deployMockCommitmentGenerator};

async function deployMockCommitmentGenerator(): Promise<MockCommitmentGenerator> {
    const PoseidonT6 = await getPoseidonT6Contract();
    const poseidonT6 = await PoseidonT6.deploy();
    await poseidonT6.deployed();

    // Link Poseidon contracts
    // @ts-ignore
    const MockCommitmentGenerator = await ethers.getContractFactory(
        'MockCommitmentGenerator',
        {
            libraries: {PoseidonT6: poseidonT6.address},
        },
    );

    return (await MockCommitmentGenerator.deploy()) as MockCommitmentGenerator;
}
