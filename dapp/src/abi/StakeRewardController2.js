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
                name: 'token',
                type: 'address',
            },
            {
                internalType: 'address',
                name: 'stakingContract',
                type: 'address',
            },
            {
                internalType: 'address',
                name: 'rewardMaster',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: '_unclaimedRewards',
                type: 'uint256',
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
                internalType: 'uint256',
                name: '_activeSince',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: '_totalStaked',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'scArpt',
                type: 'uint256',
            },
        ],
        name: 'Activated',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'staker',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'reward',
                type: 'uint256',
            },
        ],
        name: 'RewardPaid',
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
        inputs: [],
        name: 'REWARD_MASTER',
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
        name: 'REWARD_TOKEN',
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
        name: 'STAKING',
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
                name: 'staker',
                type: 'address',
            },
        ],
        name: 'entitled',
        outputs: [
            {
                internalType: 'uint256',
                name: 'rewards',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'bytes4',
                name: 'action',
                type: 'bytes4',
            },
            {
                internalType: 'bytes',
                name: 'message',
                type: 'bytes',
            },
        ],
        name: 'getRewardAdvice',
        outputs: [
            {
                components: [
                    {
                        internalType: 'address',
                        name: 'createSharesFor',
                        type: 'address',
                    },
                    {
                        internalType: 'uint96',
                        name: 'sharesToCreate',
                        type: 'uint96',
                    },
                    {
                        internalType: 'address',
                        name: 'redeemSharesFrom',
                        type: 'address',
                    },
                    {
                        internalType: 'uint96',
                        name: 'sharesToRedeem',
                        type: 'uint96',
                    },
                    {
                        internalType: 'address',
                        name: 'sendRewardTo',
                        type: 'address',
                    },
                ],
                internalType: 'struct IRewardAdviser.Advice',
                name: '',
                type: 'tuple',
            },
        ],
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
        name: 'rescueErc20',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
        ],
        name: 'rewardsClaimed',
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
        name: 'unclaimedRewards',
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
