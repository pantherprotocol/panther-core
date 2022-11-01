import {combineReducers} from '@reduxjs/toolkit';

import zkpMarketPriceReducer from './zkpMarketPrice';

export const marketPriceReducer = combineReducers({
    zkpMarketPrice: zkpMarketPriceReducer,
});
