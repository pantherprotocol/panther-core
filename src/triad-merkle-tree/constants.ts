const ABI = [
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'bytes32',
                name: 'kycId',
                type: 'bytes32',
            },
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'identityCommitment',
                type: 'bytes32',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'leafId',
                type: 'uint256',
            },
        ],
        name: 'NewIdentity',
        type: 'event',
    },
    {
        inputs: [],
        name: 'count',
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
                internalType: 'bytes32[]',
                name: 'kycIds',
                type: 'bytes32[]',
            },
            {
                internalType: 'bytes32[]',
                name: 'commitments',
                type: 'bytes32[]',
            },
        ],
        name: 'emitEvents',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'index',
                type: 'uint256',
            },
        ],
        name: 'getLeafId',
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
];

const LEAF_NODE_SIZE = 3;
const TREE_SIZE = 1536;
const TREE_DEPTH = 10;

export default {ABI, LEAF_NODE_SIZE, TREE_SIZE, TREE_DEPTH};
