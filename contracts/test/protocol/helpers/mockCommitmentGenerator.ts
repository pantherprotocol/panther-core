// @ts-ignore
import {ethers} from 'hardhat';

import {getPoseidonT4Contract} from '../../../lib/poseidonBuilder';
import {MockCommitmentGenerator} from '../../../types/contracts';

export {deployMockCommitmentGenerator};

async function deployMockCommitmentGenerator(): Promise<MockCommitmentGenerator> {
    const PoseidonT4 = await getPoseidonT4Contract();
    const poseidonT4 = await PoseidonT4.deploy();
    await poseidonT4.deployed();

    // Link Poseidon contracts
    // @ts-ignore
    const MockCommitmentGenerator = await ethers.getContractFactory(
        'MockCommitmentGenerator',
        {
            libraries: {PoseidonT4: poseidonT4.address},
        },
    );

    return (await MockCommitmentGenerator.deploy()) as MockCommitmentGenerator;
}
