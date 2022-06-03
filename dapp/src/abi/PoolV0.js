export const abi = [
    {
        inputs: [
            {
                internalType: 'address',
                name: '_owner',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'exitTime',
                type: 'uint256',
            },
            {
                internalType: 'address',
                name: 'vault',
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
                internalType: 'uint256',
                name: 'treeId',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'bytes32',
                name: 'root',
                type: 'bytes32',
            },
        ],
        name: 'AnchoredRoot',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'uint160',
                name: 'zAssetRootId',
                type: 'uint160',
            },
            {
                components: [
                    {
                        internalType: 'uint72',
                        name: '_unused',
                        type: 'uint72',
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
                name: 'zAssetRootId',
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
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'uint256',
                name: 'treeId',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'bytes32',
                name: 'root',
                type: 'bytes32',
            },
        ],
        name: 'CachedRoot',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'uint256',
                name: 'leftLeafId',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'creationTime',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'bytes32[3]',
                name: 'commitments',
                type: 'bytes32[3]',
            },
            {
                indexed: false,
                internalType: 'bytes',
                name: 'utxoData',
                type: 'bytes',
            },
        ],
        name: 'NewCommitments',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'bytes32',
                name: 'nullifier',
                type: 'bytes32',
            },
        ],
        name: 'Nullifier',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'address',
                name: 'grantee',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'prpAmount',
                type: 'uint256',
            },
        ],
        name: 'PrpGrantBurnt',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'address',
                name: 'curator',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'bytes4',
                name: 'grantType',
                type: 'bytes4',
            },
        ],
        name: 'PrpGrantDisabled',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'address',
                name: 'curator',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'bytes4',
                name: 'grantType',
                type: 'bytes4',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'prpAmount',
                type: 'uint256',
            },
        ],
        name: 'PrpGrantEnabled',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'bytes4',
                name: 'grantType',
                type: 'bytes4',
            },
            {
                indexed: false,
                internalType: 'address',
                name: 'grantee',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'prpAmount',
                type: 'uint256',
            },
        ],
        name: 'PrpGrantIssued',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'address',
                name: 'grantee',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'prpAmount',
                type: 'uint256',
            },
        ],
        name: 'PrpGrantUsed',
        type: 'event',
    },
    {
        inputs: [],
        name: 'EXIT_TIME',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
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
        inputs: [],
        name: 'VAULT',
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
                        internalType: 'uint72',
                        name: '_unused',
                        type: 'uint72',
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
        name: 'addAsset',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'prpAmount',
                type: 'uint256',
            },
        ],
        name: 'burnGrant',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint160',
                name: 'zAssetRootId',
                type: 'uint160',
            },
            {
                internalType: 'uint8',
                name: 'newStatus',
                type: 'uint8',
            },
        ],
        name: 'changeAssetStatus',
        outputs: [],
        stateMutability: 'nonpayable',
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
                internalType: 'address',
                name: 'to',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
            },
        ],
        name: 'claimEthOrErc20',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'curRoot',
        outputs: [
            {
                internalType: 'bytes32',
                name: 'root',
                type: 'bytes32',
            },
            {
                internalType: 'uint256',
                name: 'cacheIndex',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'curTree',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'curator',
                type: 'address',
            },
            {
                internalType: 'bytes4',
                name: 'grantType',
                type: 'bytes4',
            },
        ],
        name: 'disableGrants',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'curator',
                type: 'address',
            },
            {
                internalType: 'bytes4',
                name: 'grantType',
                type: 'bytes4',
            },
            {
                internalType: 'uint256',
                name: 'prpAmount',
                type: 'uint256',
            },
        ],
        name: 'enableGrants',
        outputs: [],
        stateMutability: 'nonpayable',
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
                name: 'tokenId',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
            },
            {
                internalType: 'uint32',
                name: 'creationTime',
                type: 'uint32',
            },
            {
                internalType: 'uint256',
                name: 'privSpendingKey',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'leafId',
                type: 'uint256',
            },
            {
                internalType: 'bytes32[16]',
                name: 'pathElements',
                type: 'bytes32[16]',
            },
            {
                internalType: 'bytes32',
                name: 'merkleRoot',
                type: 'bytes32',
            },
            {
                internalType: 'uint256',
                name: 'cacheIndexHint',
                type: 'uint256',
            },
        ],
        name: 'exit',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        name: 'finalRoots',
        outputs: [
            {
                internalType: 'bytes32',
                name: '',
                type: 'bytes32',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address[3]',
                name: 'tokens',
                type: 'address[3]',
            },
            {
                internalType: 'uint256[3]',
                name: 'tokenIds',
                type: 'uint256[3]',
            },
            {
                internalType: 'uint256[3]',
                name: 'extAmounts',
                type: 'uint256[3]',
            },
            {
                components: [
                    {
                        internalType: 'uint256',
                        name: 'x',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint256',
                        name: 'y',
                        type: 'uint256',
                    },
                ],
                internalType: 'struct G1Point[3]',
                name: 'pubSpendingKeys',
                type: 'tuple[3]',
            },
            {
                internalType: 'uint256[3][3]',
                name: 'secrets',
                type: 'uint256[3][3]',
            },
            {
                internalType: 'uint32',
                name: 'createdAt',
                type: 'uint32',
            },
        ],
        name: 'generateDeposits',
        outputs: [
            {
                internalType: 'uint256',
                name: 'leftLeafId',
                type: 'uint256',
            },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'curator',
                type: 'address',
            },
            {
                internalType: 'bytes4',
                name: 'grantType',
                type: 'bytes4',
            },
        ],
        name: 'getGrantAmount',
        outputs: [
            {
                internalType: 'uint256',
                name: 'prpAmount',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'leafId',
                type: 'uint256',
            },
        ],
        name: 'getLeafIndex',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'pure',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'leafId',
                type: 'uint256',
            },
        ],
        name: 'getTreeId',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'pure',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'grantee',
                type: 'address',
            },
        ],
        name: 'getUnusedGrant',
        outputs: [
            {
                internalType: 'uint256',
                name: 'prpAmount',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint160',
                name: 'zAssetRootId',
                type: 'uint160',
            },
        ],
        name: 'getZAsset',
        outputs: [
            {
                components: [
                    {
                        internalType: 'uint72',
                        name: '_unused',
                        type: 'uint72',
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
                name: 'tokenId',
                type: 'uint256',
            },
        ],
        name: 'getZAssetAndId',
        outputs: [
            {
                components: [
                    {
                        internalType: 'uint72',
                        name: '_unused',
                        type: 'uint72',
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
            {
                internalType: 'uint160',
                name: 'zAssetId',
                type: 'uint160',
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
                name: 'tokenId',
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
                internalType: 'address',
                name: 'token',
                type: 'address',
            },
        ],
        name: 'getZAssetRootId',
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
                internalType: 'address',
                name: 'grantee',
                type: 'address',
            },
            {
                internalType: 'bytes4',
                name: 'grantType',
                type: 'bytes4',
            },
        ],
        name: 'grant',
        outputs: [
            {
                internalType: 'uint256',
                name: 'prpAmount',
                type: 'uint256',
            },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'treeId',
                type: 'uint256',
            },
            {
                internalType: 'bytes32',
                name: 'root',
                type: 'bytes32',
            },
            {
                internalType: 'uint256',
                name: 'cacheIndexHint',
                type: 'uint256',
            },
        ],
        name: 'isKnownRoot',
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
    {
        inputs: [
            {
                internalType: 'bytes32',
                name: '',
                type: 'bytes32',
            },
        ],
        name: 'isSpent',
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
    {
        inputs: [
            {
                internalType: 'uint160',
                name: 'zAssetRootId',
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
    {
        inputs: [],
        name: 'leavesNum',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
            },
            {
                internalType: 'uint8',
                name: 'scale',
                type: 'uint8',
            },
        ],
        name: 'scaleAmount',
        outputs: [
            {
                internalType: 'uint96',
                name: 'scaledAmount',
                type: 'uint96',
            },
        ],
        stateMutability: 'pure',
        type: 'function',
    },
    {
        inputs: [],
        name: 'totalPrpGranted',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'totalUsedPrpGrants',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint96',
                name: 'scaledAmount',
                type: 'uint96',
            },
            {
                internalType: 'uint8',
                name: 'scale',
                type: 'uint8',
            },
        ],
        name: 'unscaleAmount',
        outputs: [
            {
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
            },
        ],
        stateMutability: 'pure',
        type: 'function',
    },
];
