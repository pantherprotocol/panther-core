import {TokenID} from '../../services/rewards';

export type StakeRewards = {
    [key in TokenID]?: string | null;
};
export interface StakesRewardsState {
    value: StakeRewards | null;
}
