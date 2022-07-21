export const abi = [
    {
        inputs: [
            {
                internalType: 'address',
                name: '_owner',
                type: 'address',
            },
        ],
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'uint160',
                name: 'zAssetRecId',
                type: 'uint160',
            },
            {
                components: [
                    {
                        internalType: 'uint64',
                        name: '_unused',
                        type: 'uint64',
                    },
                    {
                        internalType: 'uint8',
                        name: 'version',
                        type: 'uint8',
                    },
                    {
                        internalType: 'uint8',
                        name: 'status',
                        type: 'uint8',
                    },
                    {
                        internalType: 'uint8',
                        name: 'tokenType',
                        type: 'uint8',
                    },
                    {
                        internalType: 'uint8',
                        name: 'scale',
                        type: 'uint8',
                    },
                    {
                        internalType: 'address',
                        name: 'token',
                        type: 'address',
                    },
                ],
                indexed: false,
                internalType: 'struct ZAsset',
                name: 'asset',
                type: 'tuple',
            },
        ],
        name: 'AssetAdded',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'uint160',
                name: 'zAssetRecId',
                type: 'uint160',
            },
            {
                indexed: false,
                internalType: 'uint8',
                name: 'newStatus',
                type: 'uint8',
            },
            {
                indexed: false,
                internalType: 'uint8',
                name: 'oldStatus',
                type: 'uint8',
            },
        ],
        name: 'AssetStatusChanged',
        type: 'event',
    },
    {
        inputs: [],
        name: 'OWNER',
        outputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                components: [
                    {
                        internalType: 'uint64',
                        name: '_unused',
                        type: 'uint64',
                    },
                    {
                        internalType: 'uint8',
                        name: 'version',
                        type: 'uint8',
                    },
                    {
                        internalType: 'uint8',
                        name: 'status',
                        type: 'uint8',
                    },
                    {
                        internalType: 'uint8',
                        name: 'tokenType',
                        type: 'uint8',
                    },
                    {
                        internalType: 'uint8',
                        name: 'scale',
                        type: 'uint8',
                    },
                    {
                        internalType: 'address',
                        name: 'token',
                        type: 'address',
                    },
                ],
                internalType: 'struct ZAsset',
                name: 'asset',
                type: 'tuple',
            },
        ],
        name: 'addZAsset',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint160',
                name: 'zAssetRecId',
                type: 'uint160',
            },
            {
                internalType: 'uint8',
                name: 'newStatus',
                type: 'uint8',
            },
        ],
        name: 'changeZAssetStatus',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint160',
                name: 'zAssetRecId',
                type: 'uint160',
            },
        ],
        name: 'getZAsset',
        outputs: [
            {
                components: [
                    {
                        internalType: 'uint64',
                        name: '_unused',
                        type: 'uint64',
                    },
                    {
                        internalType: 'uint8',
                        name: 'version',
                        type: 'uint8',
                    },
                    {
                        internalType: 'uint8',
                        name: 'status',
                        type: 'uint8',
                    },
                    {
                        internalType: 'uint8',
                        name: 'tokenType',
                        type: 'uint8',
                    },
                    {
                        internalType: 'uint8',
                        name: 'scale',
                        type: 'uint8',
                    },
                    {
                        internalType: 'address',
                        name: 'token',
                        type: 'address',
                    },
                ],
                internalType: 'struct ZAsset',
                name: 'asset',
                type: 'tuple',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'token',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'subId',
                type: 'uint256',
            },
        ],
        name: 'getZAssetAndIds',
        outputs: [
            {
                internalType: 'uint160',
                name: 'zAssetId',
                type: 'uint160',
            },
            {
                internalType: 'uint256',
                name: '_tokenId',
                type: 'uint256',
            },
            {
                internalType: 'uint160',
                name: 'zAssetRecId',
                type: 'uint160',
            },
            {
                components: [
                    {
                        internalType: 'uint64',
                        name: '_unused',
                        type: 'uint64',
                    },
                    {
                        internalType: 'uint8',
                        name: 'version',
                        type: 'uint8',
                    },
                    {
                        internalType: 'uint8',
                        name: 'status',
                        type: 'uint8',
                    },
                    {
                        internalType: 'uint8',
                        name: 'tokenType',
                        type: 'uint8',
                    },
                    {
                        internalType: 'uint8',
                        name: 'scale',
                        type: 'uint8',
                    },
                    {
                        internalType: 'address',
                        name: 'token',
                        type: 'address',
                    },
                ],
                internalType: 'struct ZAsset',
                name: 'asset',
                type: 'tuple',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'token',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'subId',
                type: 'uint256',
            },
        ],
        name: 'getZAssetId',
        outputs: [
            {
                internalType: 'uint160',
                name: '',
                type: 'uint160',
            },
        ],
        stateMutability: 'pure',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint160',
                name: 'zAssetRecId',
                type: 'uint160',
            },
        ],
        name: 'isZAssetWhitelisted',
        outputs: [
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
];
