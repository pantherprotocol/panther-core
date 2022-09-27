export const abi = [
    {
        inputs: [
            {
                internalType: 'address',
                name: '_owner',
                type: 'address',
            },
            {
                internalType: 'address',
                name: 'assetRegistry',
                type: 'address',
            },
            {
                internalType: 'address',
                name: 'vault',
                type: 'address',
            },
            {
                internalType: 'address',
                name: 'prpGrantor',
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
                internalType: 'address',
                name: 'token',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'change',
                type: 'uint256',
            },
        ],
        name: 'Change',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'uint256',
                name: 'timestamp',
                type: 'uint256',
            },
        ],
        name: 'ExitCommitment',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'uint256',
                name: 'newExitTime',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'newExitDelay',
                type: 'uint256',
            },
        ],
        name: 'ExitTimesUpdated',
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
        inputs: [],
        name: 'ASSET_REGISTRY',
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
        name: 'PRP_GRANTOR',
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
        inputs: [
            {
                internalType: 'bytes32',
                name: 'exitCommitment',
                type: 'bytes32',
            },
        ],
        name: 'commitToExit',
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
                name: 'token',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'subId',
                type: 'uint256',
            },
            {
                internalType: 'uint64',
                name: 'scaledAmount',
                type: 'uint64',
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
                internalType: 'bytes32',
                name: '',
                type: 'bytes32',
            },
        ],
        name: 'exitCommitments',
        outputs: [
            {
                internalType: 'uint32',
                name: '',
                type: 'uint32',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'exitDelay',
        outputs: [
            {
                internalType: 'uint24',
                name: '',
                type: 'uint24',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'exitTime',
        outputs: [
            {
                internalType: 'uint32',
                name: '',
                type: 'uint32',
            },
        ],
        stateMutability: 'view',
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
                name: 'amounts',
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
                internalType: 'uint32',
                name: 'newExitTime',
                type: 'uint32',
            },
            {
                internalType: 'uint24',
                name: 'newExitDelay',
                type: 'uint24',
            },
        ],
        name: 'updateExitTimes',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
];
