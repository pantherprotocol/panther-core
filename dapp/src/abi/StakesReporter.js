export const abi = [
    {
        inputs: [
            {
                internalType: 'address',
                name: '_staking',
                type: 'address',
            },
            {
                internalType: 'address',
                name: '_stakeRewardController',
                type: 'address',
            },
        ],
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    {
        inputs: [],
        name: 'STAKE_REWARD_CONTROLLER',
        outputs: [
            {
                internalType: 'contract StakeRewardController',
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
                internalType: 'contract Staking',
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
                name: '_account',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: '_stakeID',
                type: 'uint256',
            },
        ],
        name: 'getStakeInfo',
        outputs: [
            {
                components: [
                    {
                        internalType: 'uint32',
                        name: 'id',
                        type: 'uint32',
                    },
                    {
                        internalType: 'bytes4',
                        name: 'stakeType',
                        type: 'bytes4',
                    },
                    {
                        internalType: 'uint32',
                        name: 'stakedAt',
                        type: 'uint32',
                    },
                    {
                        internalType: 'uint32',
                        name: 'lockedTill',
                        type: 'uint32',
                    },
                    {
                        internalType: 'uint32',
                        name: 'claimedAt',
                        type: 'uint32',
                    },
                    {
                        internalType: 'uint96',
                        name: 'amount',
                        type: 'uint96',
                    },
                    {
                        internalType: 'address',
                        name: 'delegatee',
                        type: 'address',
                    },
                ],
                internalType: 'struct IStakingTypes.Stake',
                name: 'stake',
                type: 'tuple',
            },
            {
                internalType: 'uint256',
                name: 'unclaimedRewards',
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
                name: '_account',
                type: 'address',
            },
        ],
        name: 'getStakesInfo',
        outputs: [
            {
                components: [
                    {
                        internalType: 'uint32',
                        name: 'id',
                        type: 'uint32',
                    },
                    {
                        internalType: 'bytes4',
                        name: 'stakeType',
                        type: 'bytes4',
                    },
                    {
                        internalType: 'uint32',
                        name: 'stakedAt',
                        type: 'uint32',
                    },
                    {
                        internalType: 'uint32',
                        name: 'lockedTill',
                        type: 'uint32',
                    },
                    {
                        internalType: 'uint32',
                        name: 'claimedAt',
                        type: 'uint32',
                    },
                    {
                        internalType: 'uint96',
                        name: 'amount',
                        type: 'uint96',
                    },
                    {
                        internalType: 'address',
                        name: 'delegatee',
                        type: 'address',
                    },
                ],
                internalType: 'struct IStakingTypes.Stake[]',
                name: 'stakes',
                type: 'tuple[]',
            },
            {
                internalType: 'uint256[]',
                name: 'unclaimedRewards',
                type: 'uint256[]',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '_scArptFrom',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: '_scArptTill',
                type: 'uint256',
            },
            {
                internalType: 'uint96',
                name: 'amount',
                type: 'uint96',
            },
        ],
        name: 'getUnclaimedRewards',
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
