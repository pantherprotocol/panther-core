import {configureStore} from '@reduxjs/toolkit';

import chainBalanceReducer from './slices/chainBalance';
import totalStakedReducer from './slices/totalStaked';
import zkpMarketPriceReducer from './slices/zkpMarketPrice';

export const store = configureStore({
    reducer: {
        chainBalance: chainBalanceReducer,
        totalStaked: totalStakedReducer,
        zkpMarketPrice: zkpMarketPriceReducer,
    },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
