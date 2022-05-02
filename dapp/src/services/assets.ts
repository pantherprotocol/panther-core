import {getStakingContract} from './contracts';

export interface ZAsset {
    id: number;
    name: string;
    value: string;
    balanceCoin: string;
    balanceValue: string;
    hasMenu: boolean;
}

export async function getZAssets(
    library: any,
    chainId: number,
): Promise<ZAsset[]> {
    let zAssets: ZAsset[] = [];
    const assets: ZAsset[] = [
        {
            id: 1,
            name: 'zETH',
            value: '$3,245.17',
            balanceCoin: '1.75',
            balanceValue: '$5,691.91',
            hasMenu: true,
        },
        {
            id: 2,
            name: 'zPNTR',
            value: '$0.78',
            balanceCoin: '1.75',
            balanceValue: '$5,691.91',
            hasMenu: true,
        },
        {
            id: 3,
            name: 'zBTC',
            value: '$51,412.19',
            balanceCoin: '1.75',
            balanceValue: '$5,691.91',
            hasMenu: true,
        },
        {
            id: 4,
            name: 'zUSDT',
            value: '$1.00',
            balanceCoin: '1.75',
            balanceValue: '$5,691.91',
            hasMenu: true,
        },
        {
            id: 5,
            name: 'zLINK',
            value: '$3,245.17',
            balanceCoin: '1.75',
            balanceValue: '$5,691.91',
            hasMenu: true,
        },
        {
            id: 6,
            name: 'zFLR',
            value: '$3,245.17',
            balanceCoin: '1.75',
            balanceValue: '$5,691.91',
            hasMenu: true,
        },
        {
            id: 7,
            name: 'zBNB',
            value: '$3,245.17',
            balanceCoin: '1.75',
            balanceValue: '$5,691.91',
            hasMenu: true,
        },
    ];

    const contract = getStakingContract(library, chainId);
    try {
        // @ts-ignore
        return await contract.getAllAssets();
    } catch (err: any) {
        console.warn('Failed to fetch all assets from Staking contract:', err);
        // return err;
    }
    zAssets = assets;
    return zAssets;
}
