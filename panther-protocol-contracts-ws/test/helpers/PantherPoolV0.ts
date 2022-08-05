// @ts-ignore
import { ethers } from 'hardhat';
import {
    getPoseidonT3Contract,
    getPoseidonT4Contract,
    getPoseidonT6Contract,
} from '../../lib/poseidonBuilder';
import { MockPantherPoolV0 } from '../../types';

import { smock } from '@defi-wonderland/smock';

export { deployPantherPoolV0 };

async function deployPantherPoolV0(): Promise<MockPantherPoolV0> {
    const [owner] = await ethers.getSigners();

    const zAssetRegistry = await smock.fake('ZAssetsRegistry');
    const vault = await smock.fake('Vault');
    const prpGrantor = await smock.fake('PrpGrantor');

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
    const PantherPoolV0 = await ethers.getContractFactory('MockPantherPoolV0', {
        libraries: {
            PoseidonT3: poseidonT3.address,
            PoseidonT4: poseidonT4.address,
            PoseidonT6: poseidonT6.address,
        },
    });

    return (await (
        await PantherPoolV0.deploy(
            owner.address,
            zAssetRegistry.address,
            vault.address,
            prpGrantor.address,
        )
    ).deployed()) as MockPantherPoolV0;
}
