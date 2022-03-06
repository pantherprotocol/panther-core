import {configureStore} from '@reduxjs/toolkit';

import chainBalanceReducer from './slices/chainBalance';
import totalStakedReducer from './slices/totalStaked';

export const store = configureStore({
    reducer: {
        chainBalance: chainBalanceReducer,
        totalStaked: totalStakedReducer,
    },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
