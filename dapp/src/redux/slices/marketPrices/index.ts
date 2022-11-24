// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {combineReducers} from '@reduxjs/toolkit';

import zkpMarketPriceReducer from './zkp-market-price';

export const marketPriceReducer = combineReducers({
    zkpMarketPrice: zkpMarketPriceReducer,
});
