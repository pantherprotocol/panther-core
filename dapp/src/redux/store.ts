import {configureStore} from '@reduxjs/toolkit';

import advancedStakeInputRewardsReducer from './slices/advancedStakePredictedRewards';
import advancedStakesRewardsReducer from './slices/advancedStakesRewards';
import blurReducer from './slices/blur';
import chainBalanceReducer from './slices/chainBalance';
import stakeTermsReducer from './slices/stakeTerms';
import totalStakedReducer from './slices/totalStaked';
import unclaimedStakesRewardsReducer from './slices/unclaimedStakesRewards';
import zkpMarketPriceReducer from './slices/zkpMarketPrice';
import zkpStakedBalanceReducer from './slices/zkpStakedBalance';
import zkpTokenBalanceReducer from './slices/zkpTokenBalance';

export const store = configureStore({
    reducer: {
        chainBalance: chainBalanceReducer,
        totalStaked: totalStakedReducer,
        zkpMarketPrice: zkpMarketPriceReducer,
        blur: blurReducer,
        zkpTokenBalance: zkpTokenBalanceReducer,
        zkpStakedBalance: zkpStakedBalanceReducer,
        advancedStakeInputRewards: advancedStakeInputRewardsReducer,
        unclaimedStakesRewards: unclaimedStakesRewardsReducer,
        advancedStakesRewards: advancedStakesRewardsReducer,
        stakeTerms: stakeTermsReducer,
    },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
