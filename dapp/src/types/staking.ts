import {TokenID, AdvancedTokenIDs} from '../services/rewards';

export type StakeTypes = 'classic' | 'advanced';
export enum StakeType {
    Classic = 'classic',
    Advanced = 'advanced',
}

export type StakeRewards = {
    [key in TokenID]?: string | null;
};

export type AdvancedStakeReward = {
    [key in AdvancedTokenIDs]: string;
};
