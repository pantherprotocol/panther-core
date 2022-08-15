// @ts-ignore
import { PantherPoolV0AndZAssetRegistryTester } from '../../types';
import { getPantherPoolMocFactoryByName } from './hardhat';

export { deployPantherPoolV0AndZAssetRegistryTester };

async function deployPantherPoolV0AndZAssetRegistryTester(): Promise<PantherPoolV0AndZAssetRegistryTester> {
    const PantherPoolV0 = await getPantherPoolMocFactoryByName(
        'PantherPoolV0AndZAssetRegistryTester',
    );

    return (await (
        await PantherPoolV0.deploy()
    ).deployed()) as PantherPoolV0AndZAssetRegistryTester;
}
