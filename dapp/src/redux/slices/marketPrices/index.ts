import {combineReducers} from '@reduxjs/toolkit';

import zkpMarketPriceReducer from './zkp-market-price';

export const marketPriceReducer = combineReducers({
    zkpMarketPrice: zkpMarketPriceReducer,
});
