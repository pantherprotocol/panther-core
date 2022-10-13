import {combineReducers} from '@reduxjs/toolkit';

import advancedStakeInputRewardsReducer from './advancedStakePredictedRewards';
import remainingPrpRewardsReducer from './remainingPrpRewards';
import stakeAmountReducer from './stakeAmount';
import stakeTermsReducer from './stakeTerms';
import totalStakedReducer from './totalsOfAdvancedStakes';
import totalUnclaimedClassicRewardsReducer from './totalUnclaimedClassicRewards';
import zkpStakedBalanceReducer from './zkpStakedBalance';

export const stakingReducer = combineReducers({
    totalsOfAdvancedStakes: totalStakedReducer,
    zkpStakedBalance: zkpStakedBalanceReducer,
    advancedStakeInputRewards: advancedStakeInputRewardsReducer,
    stakeTerms: stakeTermsReducer,
    totalUnclaimedClassicRewards: totalUnclaimedClassicRewardsReducer,
    stakeAmount: stakeAmountReducer,
    remainingPrpRewards: remainingPrpRewardsReducer,
});
