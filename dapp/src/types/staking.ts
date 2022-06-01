import {BigNumber} from 'ethers'

export type StakeTypes = 'classic' | 'advanced';

export enum StakeType {
    Classic = 'classic',
    Advanced = 'advanced',
}

export type StakeReward = {
// BigNumber string to allow serialization in Redux
    [key in StakingRewardTokenID]?: string | null;
};
export type StakeRewardBN = ClassicStakeRewardBN | AdvancedStakeRewardsBN;

export type ClassicStakeRewardBN = BigNumber;

export type AdvancedStakeRewards = {
// BigNumber string to allow serialization in Redux
    [key in AdvancedStakeTokenIDs]: string;
};

export type AdvancedStakeRewardsBN = {
    [key in AdvancedStakeTokenIDs]: BigNumber;
};

export type AdvancedStakeTokenIDs = 'PRP' | 'zZKP';

export enum StakingRewardTokenID {
    ZKP = 'ZKP',
    zZKP = 'zZKP',
    PRP = 'PRP',
}
