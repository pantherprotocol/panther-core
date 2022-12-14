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
                name: '_grantProcessor',
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
        name: 'PrpGrantRedeemed',
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
        name: 'disableGrantType',
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
        name: 'enableGrantType',
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
                internalType: 'address',
                name: 'grantee',
                type: 'address',
            },
        ],
        name: 'getUnusedGrantAmount',
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
        inputs: [],
        name: 'grantProcessor',
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
                name: 'grantee',
                type: 'address',
            },
            {
                internalType: 'bytes4',
                name: 'grantType',
                type: 'bytes4',
            },
        ],
        name: 'issueGrant',
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
                internalType: 'address',
                name: 'grantee',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'prpAmount',
                type: 'uint256',
            },
        ],
        name: 'issueOwnerGrant',
        outputs: [],
        stateMutability: 'nonpayable',
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
                internalType: 'uint256',
                name: 'prpAmount',
                type: 'uint256',
            },
        ],
        name: 'redeemGrant',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'totalGrantsIssued',
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
        name: 'totalGrantsRedeemed',
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
