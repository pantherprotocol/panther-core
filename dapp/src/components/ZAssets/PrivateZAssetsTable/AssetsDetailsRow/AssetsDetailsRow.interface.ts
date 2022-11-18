import {AdvancedStakeRewards} from 'types/staking';

export type AssetsDetailsRowProperties = {
    reward: AdvancedStakeRewards;
    isSelected: boolean;
    onSelectReward: (rewardId: string | undefined) => void;
};
