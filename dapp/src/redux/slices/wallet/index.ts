import {combineReducers} from '@reduxjs/toolkit';

import advancedStakesRewardsReducer from './advancedStakesRewards';
import chainBalanceReducer from './chainBalance';
import poolV0Reducer from './poolV0';
import zkpTokenBalanceReducer from './zkpTokenBalance';

export const walletReducer = combineReducers({
    advancedStakesRewards: advancedStakesRewardsReducer,
    chainBalance: chainBalanceReducer,
    poolV0: poolV0Reducer,
    zkpTokenBalance: zkpTokenBalanceReducer,
});
