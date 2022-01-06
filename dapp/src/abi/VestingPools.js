export const abi = [
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'previousOwner',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'newOwner',
                type: 'address',
            },
        ],
        name: 'OwnershipTransferred',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'uint256',
                name: 'poolId',
                type: 'uint256',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'wallet',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'allocation',
                type: 'uint256',
            },
        ],
        name: 'PoolAdded',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'uint256',
                name: 'poolId',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'start',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'vestingDays',
                type: 'uint256',
            },
        ],
        name: 'PoolUpdated',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'uint256',
                name: 'poolId',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'address',
                name: 'to',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
            },
        ],
        name: 'Released',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'uint256',
                name: 'indexedpoolId',
                type: 'uint256',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'newWallet',
                type: 'address',
            },
        ],
        name: 'WalletUpdated',
        type: 'event',
    },
    {
        inputs: [
            {
                internalType: 'address[]',
                name: 'wallets',
                type: 'address[]',
            },
            {
                components: [
                    {
                        internalType: 'bool',
                        name: 'isPreMinted',
                        type: 'bool',
                    },
                    {
                        internalType: 'bool',
                        name: 'isAdjustable',
                        type: 'bool',
                    },
                    {
                        internalType: 'uint32',
                        name: 'start',
                        type: 'uint32',
                    },
                    {
                        internalType: 'uint16',
                        name: 'vestingDays',
                        type: 'uint16',
                    },
                    {
                        internalType: 'uint48',
                        name: 'sAllocation',
                        type: 'uint48',
                    },
                    {
                        internalType: 'uint48',
                        name: 'sUnlocked',
                        type: 'uint48',
                    },
                    {
                        internalType: 'uint96',
                        name: 'vested',
                        type: 'uint96',
                    },
                ],
                internalType: 'struct PoolParams[]',
                name: 'pools',
                type: 'tuple[]',
            },
        ],
        name: 'addVestingPools',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'claimedToken',
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
        name: 'claimErc20',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'poolId',
                type: 'uint256',
            },
        ],
        name: 'getPool',
        outputs: [
            {
                components: [
                    {
                        internalType: 'bool',
                        name: 'isPreMinted',
                        type: 'bool',
                    },
                    {
                        internalType: 'bool',
                        name: 'isAdjustable',
                        type: 'bool',
                    },
                    {
                        internalType: 'uint32',
                        name: 'start',
                        type: 'uint32',
                    },
                    {
                        internalType: 'uint16',
                        name: 'vestingDays',
                        type: 'uint16',
                    },
                    {
                        internalType: 'uint48',
                        name: 'sAllocation',
                        type: 'uint48',
                    },
                    {
                        internalType: 'uint48',
                        name: 'sUnlocked',
                        type: 'uint48',
                    },
                    {
                        internalType: 'uint96',
                        name: 'vested',
                        type: 'uint96',
                    },
                ],
                internalType: 'struct PoolParams',
                name: '',
                type: 'tuple',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'poolId',
                type: 'uint256',
            },
        ],
        name: 'getWallet',
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
        name: 'owner',
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
                internalType: 'uint256',
                name: 'poolId',
                type: 'uint256',
            },
        ],
        name: 'releasableAmount',
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
                name: 'poolId',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
            },
        ],
        name: 'release',
        outputs: [
            {
                internalType: 'uint256',
                name: 'released',
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
                name: 'poolId',
                type: 'uint256',
            },
            {
                internalType: 'address',
                name: 'account',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
            },
        ],
        name: 'releaseTo',
        outputs: [
            {
                internalType: 'uint256',
                name: 'released',
                type: 'uint256',
            },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'removeContract',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'renounceOwnership',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'token',
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
        name: 'totalAllocation',
        outputs: [
            {
                internalType: 'uint96',
                name: '',
                type: 'uint96',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'totalVested',
        outputs: [
            {
                internalType: 'uint96',
                name: '',
                type: 'uint96',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'newOwner',
                type: 'address',
            },
        ],
        name: 'transferOwnership',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'poolId',
                type: 'uint256',
            },
            {
                internalType: 'uint32',
                name: 'start',
                type: 'uint32',
            },
            {
                internalType: 'uint16',
                name: 'vestingDays',
                type: 'uint16',
            },
        ],
        name: 'updatePoolTime',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'poolId',
                type: 'uint256',
            },
            {
                internalType: 'address',
                name: 'newWallet',
                type: 'address',
            },
        ],
        name: 'updatePoolWallet',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'poolId',
                type: 'uint256',
            },
        ],
        name: 'vestedAmount',
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
];
