// @ts-ignore
import {PantherPoolV0AndZAssetRegistryAndVaultTester} from '../../types/contracts';
import {getPantherPoolMocFactoryByName} from './pantherPoolMockFactory';

export {deployPantherPoolV0AndZAssetRegistryAndVaultTester};

async function deployPantherPoolV0AndZAssetRegistryAndVaultTester(): Promise<PantherPoolV0AndZAssetRegistryAndVaultTester> {
    const PantherPoolV0 = await getPantherPoolMocFactoryByName(
        'PantherPoolV0AndZAssetRegistryAndVaultTester',
    );

    return (await (
        await PantherPoolV0.deploy()
    ).deployed()) as PantherPoolV0AndZAssetRegistryAndVaultTester;
}
