import {configureStore} from '@reduxjs/toolkit';

import chainBalanceReducer from './slices/chainBalance';

export const store = configureStore({
    reducer: {
        chainBalance: chainBalanceReducer,
    },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
