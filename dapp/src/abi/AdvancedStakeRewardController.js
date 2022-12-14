export const abi = [
    {
        inputs: [
            {internalType: 'address', name: '_owner', type: 'address'},
            {internalType: 'address', name: 'rewardMaster', type: 'address'},
            {internalType: 'address', name: 'pantherPool', type: 'address'},
            {internalType: 'address', name: 'zkpToken', type: 'address'},
            {internalType: 'address', name: 'nftToken', type: 'address'},
        ],
        stateMutability: 'nonpayable',
        type: 'constructor',
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
                name: 'firstLeafId',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'zkp',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'nft',
                type: 'uint256',
            },
        ],
        name: 'RewardGenerated',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                components: [
                    {
                        internalType: 'uint96',
                        name: 'zkpRewards',
                        type: 'uint96',
                    },
                    {
                        internalType: 'uint24',
                        name: 'nftRewards',
                        type: 'uint24',
                    },
                ],
                indexed: false,
                internalType: 'struct AdvancedStakeRewardController.Limits',
                name: 'newLimits',
                type: 'tuple',
            },
        ],
        name: 'RewardLimitUpdated',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                components: [
                    {internalType: 'uint32', name: 'startTime', type: 'uint32'},
                    {internalType: 'uint32', name: 'endTime', type: 'uint32'},
                    {internalType: 'uint8', name: 'startZkpApy', type: 'uint8'},
                    {internalType: 'uint8', name: 'endZkpApy', type: 'uint8'},
                ],
                indexed: false,
                internalType:
                    'struct AdvancedStakeRewardController.RewardParams',
                name: 'newRewardParams',
                type: 'tuple',
            },
        ],
        name: 'RewardParamsUpdated',
        type: 'event',
    },
    {
        inputs: [],
        name: 'OWNER',
        outputs: [{internalType: 'address', name: '', type: 'address'}],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'PANTHER_POOL',
        outputs: [{internalType: 'address', name: '', type: 'address'}],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'REWARD_MASTER',
        outputs: [{internalType: 'address', name: '', type: 'address'}],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'START_BLOCK',
        outputs: [{internalType: 'uint256', name: '', type: 'uint256'}],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {internalType: 'bytes4', name: 'action', type: 'bytes4'},
            {internalType: 'bytes', name: 'message', type: 'bytes'},
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
        inputs: [{internalType: 'uint256', name: 'time', type: 'uint256'}],
        name: 'getZkpApyAt',
        outputs: [{internalType: 'uint256', name: '', type: 'uint256'}],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'limits',
        outputs: [
            {internalType: 'uint96', name: 'zkpRewards', type: 'uint96'},
            {internalType: 'uint24', name: 'nftRewards', type: 'uint24'},
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {internalType: 'address', name: '', type: 'address'},
            {internalType: 'address', name: '', type: 'address'},
            {internalType: 'uint256', name: '', type: 'uint256'},
            {internalType: 'bytes', name: '', type: 'bytes'},
        ],
        name: 'onERC721Received',
        outputs: [{internalType: 'bytes4', name: '', type: 'bytes4'}],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {internalType: 'address', name: 'token', type: 'address'},
            {internalType: 'address', name: 'to', type: 'address'},
            {internalType: 'uint256', name: 'amount', type: 'uint256'},
        ],
        name: 'rescueErc20',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'rewardParams',
        outputs: [
            {internalType: 'uint32', name: 'startTime', type: 'uint32'},
            {internalType: 'uint32', name: 'endTime', type: 'uint32'},
            {internalType: 'uint8', name: 'startZkpApy', type: 'uint8'},
            {internalType: 'uint8', name: 'endZkpApy', type: 'uint8'},
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '_desiredNftRewardsLimit',
                type: 'uint256',
            },
        ],
        name: 'setNftRewardLimit',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'totals',
        outputs: [
            {internalType: 'uint96', name: 'zkpRewards', type: 'uint96'},
            {internalType: 'uint24', name: 'nftRewards', type: 'uint24'},
            {internalType: 'uint40', name: 'scZkpStaked', type: 'uint40'},
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                components: [
                    {internalType: 'uint32', name: 'startTime', type: 'uint32'},
                    {internalType: 'uint32', name: 'endTime', type: 'uint32'},
                    {internalType: 'uint8', name: 'startZkpApy', type: 'uint8'},
                    {internalType: 'uint8', name: 'endZkpApy', type: 'uint8'},
                ],
                internalType:
                    'struct AdvancedStakeRewardController.RewardParams',
                name: '_newParams',
                type: 'tuple',
            },
        ],
        name: 'updateRewardParams',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'updateZkpRewardsLimit',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
];
