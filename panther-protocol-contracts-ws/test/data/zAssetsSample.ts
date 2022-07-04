import { toBigNum } from '../../lib/utilities';
import { ethers } from 'hardhat';
// eslint-disable-next-line import/named
import { BigNumberish } from 'ethers';

/* eslint-disable  no-unused-vars */
export enum ZAssetStatus {
    ENABLED = 1,
    DISABLED = 2,
    UNKNOWN = 0,
}

export enum TokenTypes {
    ERC20 = 0,
    ERC721 = 0x10,
    ERC1155 = 0x11,
}
/* eslint-enable  no-unused-vars */

export type ZAsset = {
    _unused: number;
    version: number;
    status: number;
    tokenType: number;
    scale: number;
    token: string;
};

const tokensAddresses = [
    // ERC20
    '0xAC088b095f41AE65bEc3aA4b645A0A0423388BCD',
    // NFTs
    '0x6984296bDd8CD743315A138B463F6c1Cb738e425',
    '0xED9E25Cb5f981e9aeBE774DbdFc18EbFBFA65d12',

    // Missing in `zAssetsIds` and `getZAssets()`
    '0x41c2ED741646abccC80b80B51Bd2b051052e9702',
    '0x94eDb578d9554ff5f37BCB474F176B28239A29d4',
];

const randomTokenId = '183937687536747896802517049574113297679861733038';
const rootIdERC20V1 = '982136930340192156211689002266823588686285278156';

export const getZAssets = (): ZAsset[] => {
    return [
        {
            _unused: 0,
            version: 0,
            status: ZAssetStatus.ENABLED,
            tokenType: TokenTypes.ERC20,
            scale: 0,
            token: tokensAddresses[0],
        },
        {
            _unused: 0,
            version: 0,
            status: ZAssetStatus.ENABLED,
            tokenType: TokenTypes.ERC721,
            scale: 0,
            token: tokensAddresses[1],
        },
        {
            _unused: 0,
            version: 0,
            status: ZAssetStatus.ENABLED,
            tokenType: TokenTypes.ERC1155,
            scale: 0,
            token: tokensAddresses[2],
        },
        // ERC-20 alternate asset
        {
            _unused: 0,
            version: 1,
            status: ZAssetStatus.ENABLED,
            tokenType: TokenTypes.ERC20,
            scale: 0,
            token: tokensAddresses[0],
        },
    ];
};

export const getIds = () => {
    return [
        // ERC-20
        {
            token: tokensAddresses[0],
            tokenId: 0, // always 0 for ERC-20
            zAssetRootId: getRootId(tokensAddresses[0]),
            zAssetId: getZAssetId(tokensAddresses[0]),
        },
        // NFTs follow
        {
            token: tokensAddresses[1],
            tokenId: 0,
            zAssetRootId: getRootId(tokensAddresses[1]),
            zAssetId: getZAssetId(tokensAddresses[1], 0),
        },
        {
            token: tokensAddresses[2],
            tokenId: 0,
            zAssetRootId: getRootId(tokensAddresses[2]),
            zAssetId: getZAssetId(tokensAddresses[2], 0),
        },
        {
            token: tokensAddresses[1],
            tokenId: randomTokenId,
            zAssetRootId: getRootId(tokensAddresses[1]),
            zAssetId: getZAssetId(tokensAddresses[1], randomTokenId),
        },
        {
            token: tokensAddresses[2],
            tokenId: randomTokenId,
            zAssetRootId: getRootId(tokensAddresses[2]),
            zAssetId: getZAssetId(tokensAddresses[2], randomTokenId),
        },
    ];
};

export const getMissingIds = () => [
    {
        token: tokensAddresses[3],
        tokenId: 0,
        zAssetRootId: getRootId(tokensAddresses[3]),
        zAssetId: getZAssetId(tokensAddresses[3], 0),
    },
    {
        token: tokensAddresses[4],
        tokenId: randomTokenId,
        zAssetRootId: getRootId(tokensAddresses[4]),
        zAssetId: getZAssetId(tokensAddresses[4], randomTokenId),
    },
];

export const getZeroZAsset = () => ({
    _unused: 0,
    version: 0,
    status: ZAssetStatus.UNKNOWN,
    tokenType: TokenTypes.ERC20,
    scale: 0,
    token: '0x0000000000000000000000000000000000000000',
});

export const getERC20AlternateAssetId = () => [
    {
        token: tokensAddresses[0],
        tokenId: 1,
        zAssetRootId: toBigNum(rootIdERC20V1),
        zAssetId: getZAssetId(tokensAddresses[0], 1),
    },
];

export function getRootId(token: BigNumberish) {
    return toBigNum(token.toString());
}

export function getZAssetId(token: BigNumberish, tokenId: BigNumberish = 0) {
    return toBigNum(
        ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
                ['uint', 'uint'],
                [toBigNum(token.toString()), toBigNum(tokenId.toString())],
            ),
        ),
    ).div(toBigNum(2).pow(96));
}
