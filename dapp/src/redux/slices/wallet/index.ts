import {combineReducers} from '@reduxjs/toolkit';
import {persistReducer} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import advancedStakesRewardsReducer from './advanced-stakes-rewards';
import chainBalanceReducer from './chain-balance';
import poolV0Reducer from './poolV0';
import zkpTokenBalanceReducer from './zkp-token-balance';

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
