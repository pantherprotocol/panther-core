import {combineReducers} from '@reduxjs/toolkit';
import {persistReducer} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import advancedStakesRewardsReducer from './advancedStakesRewards';
import chainBalanceReducer from './chainBalance';
import poolV0Reducer from './poolV0';
import zkpTokenBalanceReducer from './zkpTokenBalance';

const walletPersistConfig = {
    key: 'wallet',
    storage: storage,
    whitelist: ['advancedStakesRewards'],
};

const reducer = combineReducers({
    advancedStakesRewards: advancedStakesRewardsReducer,
    chainBalance: chainBalanceReducer,
    poolV0: poolV0Reducer,
    zkpTokenBalance: zkpTokenBalanceReducer,
});

export const walletReducer = persistReducer(walletPersistConfig, reducer);
