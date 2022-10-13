import {AdvancedStakeRewards} from '../../../../types/staking';

export type RedeemRewardProperties = {
    reward: AdvancedStakeRewards;
    isSelected: boolean;
    onSelectReward: (rewardId: string | undefined) => void;
};
