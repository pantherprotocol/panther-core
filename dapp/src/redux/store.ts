import {configureStore, combineReducers} from '@reduxjs/toolkit';
import {
    persistStore,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
} from 'redux-persist';
import {marketPriceReducer} from 'redux/slices/marketPrices';
import {stakingReducer} from 'redux/slices/staking';
import {uiReducer} from 'redux/slices/ui';
import {walletReducer} from 'redux/slices/wallet';

export const rootReducer = combineReducers({
    ui: uiReducer,
    marketPrice: marketPriceReducer,
    staking: stakingReducer,
    wallet: walletReducer,
});

export const store = configureStore({
    reducer: rootReducer,
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
