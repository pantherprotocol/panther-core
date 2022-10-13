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

import {marketPriceReducer} from './slices/marketPrices';
import {stakingReducer} from './slices/staking';
import {uiReducer} from './slices/ui';
import {walletReducer} from './slices/wallet';

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
    ui: uiReducer,
    marketPrice: marketPriceReducer,
    staking: stakingReducer,
    wallet: walletReducer,
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
