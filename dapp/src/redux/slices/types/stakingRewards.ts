import {TokenID} from '../../../services/rewards';

export type StakeRewards = {
    [key in TokenID]?: string | null;
};
