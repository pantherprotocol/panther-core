// @ts-ignore
import {smock} from '@defi-wonderland/smock';
import {ethers} from 'hardhat';

import {MockPantherPoolV0} from '../../../types/contracts';

import {getPantherPoolMocFactoryByName} from './pantherPoolMockFactory';

export {deployPantherPoolV0};

async function deployPantherPoolV0(): Promise<MockPantherPoolV0> {
    const [owner] = await ethers.getSigners();

    const zAssetRegistry = await smock.fake('ZAssetsRegistry');
    const vault = await smock.fake('Vault');

    const PantherPoolV0 = await getPantherPoolMocFactoryByName(
        'MockPantherPoolV0',
    );

    return (await (
        await PantherPoolV0.deploy(
            owner.address,
            zAssetRegistry.address,
            vault.address,
        )
    ).deployed()) as MockPantherPoolV0;
}
