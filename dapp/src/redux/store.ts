import {configureStore} from '@reduxjs/toolkit';

import blurReducer from './slices/blur';
import chainBalanceReducer from './slices/chainBalance';
import totalStakedReducer from './slices/totalStaked';
import rewardsReducer from './slices/unclaimedStakesRewards';
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
        unclaimedStakesRewards: rewardsReducer,
    },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
