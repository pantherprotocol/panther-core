// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {formatEther} from '@ethersproject/units';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {safeParseStringToBN} from 'lib/numbers';
import {BalanceState, createExtraReducers} from 'redux/slices/shared';
import {RootState} from 'redux/store';
import * as stakingService from 'services/staking';

const initialState: BalanceState = {
    value: null,
    status: 'idle',
};

export const getZKPTokenMarketPrice = createAsyncThunk(
    'marketPrices/$ZKP',
    async (): Promise<string | null> => {
        const price = await stakingService.getZKPMarketPrice();
        if (price) {
            console.debug(`Fetched $ZKP market price: \$${formatEther(price)}`);
        }
        return price?.toString() ?? null;
    },
);

export const zkpMarketPriceSlice = createSlice({
    name: 'zkpMarketPrice',
    initialState,
    reducers: {},
    extraReducers: builder => {
        createExtraReducers({
            builder,
            asyncThunk: getZKPTokenMarketPrice,
        });
    },
});

export const zkpMarketPriceSelector = (state: RootState) => {
    return safeParseStringToBN(state.marketPrice.zkpMarketPrice.value);
};

export default zkpMarketPriceSlice.reducer;
