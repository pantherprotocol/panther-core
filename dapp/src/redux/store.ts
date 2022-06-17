import {configureStore} from '@reduxjs/toolkit';
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

import advancedStakeInputRewardsReducer from './slices/advancedStakePredictedRewards';
import advancedStakesRewardsReducer from './slices/advancedStakesRewards';
import blurReducer from './slices/blur';
import chainBalanceReducer from './slices/chainBalance';
import stakeTermsReducer from './slices/stakeTerms';
import totalStakedReducer from './slices/totalStaked';
import totalUnclaimedClassicRewardsReducer from './slices/totalUnclaimedClassicRewards';
import zkpMarketPriceReducer from './slices/zkpMarketPrice';
import zkpStakedBalanceReducer from './slices/zkpStakedBalance';
import zkpTokenBalanceReducer from './slices/zkpTokenBalance';

const rootPersistConfig = {
    key: 'advancedStakesRewards',
    storage: storage,
};

export const store = configureStore({
    reducer: {
        chainBalance: chainBalanceReducer,
        totalStaked: totalStakedReducer,
        zkpMarketPrice: zkpMarketPriceReducer,
        blur: blurReducer,
        zkpTokenBalance: zkpTokenBalanceReducer,
        zkpStakedBalance: zkpStakedBalanceReducer,
        advancedStakeInputRewards: advancedStakeInputRewardsReducer,
        totalUnclaimedClassicRewards: totalUnclaimedClassicRewardsReducer,
        advancedStakesRewards: persistReducer(
            rootPersistConfig,
            advancedStakesRewardsReducer as any,
        ) as any,
        stakeTerms: stakeTermsReducer,
    },
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
