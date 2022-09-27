import {configureStore, combineReducers} from '@reduxjs/toolkit';
import {
    persistReducer,
    persistStore,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import acknowledgedNotificationsReducer from './slices/acknowledgedNotifications';
import advancedStakeInputRewardsReducer from './slices/advancedStakePredictedRewards';
import advancedStakesRewardsReducer from './slices/advancedStakesRewards';
import blurReducer from './slices/blur';
import chainBalanceReducer from './slices/chainBalance';
import isWalletConnectedReducer from './slices/isWalletConnected';
import poolV0Reducer from './slices/poolV0';
import remainingPrpRewardsReducer from './slices/remainingPrpRewards';
import stakeAmountReducer from './slices/stakeAmount';
import stakeTermsReducer from './slices/stakeTerms';
import totalStakedReducer from './slices/totalsOfAdvancedStakes';
import totalUnclaimedClassicRewardsReducer from './slices/totalUnclaimedClassicRewards';
import Web3WalletLastActionReducer from './slices/web3WalletLastAction';
import zkpMarketPriceReducer from './slices/zkpMarketPrice';
import zkpStakedBalanceReducer from './slices/zkpStakedBalance';
import zkpTokenBalanceReducer from './slices/zkpTokenBalance';

const rootPersistConfig = {
    key: 'root',
    storage: storage,
    whitelist: [
        'advancedStakesRewards',
        'isWalletConnected',
        'acknowledgedNotifications',
    ],
};
export const rootReducer = combineReducers({
    advancedStakesRewards: advancedStakesRewardsReducer,
    blur: blurReducer,
    chainBalance: chainBalanceReducer,
    poolV0: poolV0Reducer,
    totalsOfAdvancedStakes: totalStakedReducer,
    zkpMarketPrice: zkpMarketPriceReducer,
    zkpTokenBalance: zkpTokenBalanceReducer,
    zkpStakedBalance: zkpStakedBalanceReducer,
    advancedStakeInputRewards: advancedStakeInputRewardsReducer,
    stakeTerms: stakeTermsReducer,
    totalUnclaimedClassicRewards: totalUnclaimedClassicRewardsReducer,
    Web3WalletLastAction: Web3WalletLastActionReducer,
    stakeAmount: stakeAmountReducer,
    isWalletConnected: isWalletConnectedReducer,
    remainingPrpRewards: remainingPrpRewardsReducer,
    acknowledgedNotifications: acknowledgedNotificationsReducer,
});

export const persistedReducer = persistReducer(rootPersistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
            serializableCheck: {
                // https://redux-toolkit.js.org/usage/usage-guide#use-with-redux-persist
                // says it's necessary to ignore all the action types
                // dispatched by redux-persist:
                ignoredActions: [
                    FLUSH,
                    REHYDRATE,
                    PAUSE,
                    PERSIST,
                    PURGE,
                    REGISTER,
                ],
            },
        }),
});

export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
