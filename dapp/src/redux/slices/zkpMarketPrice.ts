import {BigNumber} from '@ethersproject/bignumber';
import {formatEther} from '@ethersproject/units';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';

import * as stakingService from '../../services/staking';
import {RootState} from '../store';

interface ZkpTokenMarketPriceState {
    value: string | null;
    status: 'idle' | 'loading' | 'failed';
}
const initialState: ZkpTokenMarketPriceState = {
    value: null,
    status: 'idle',
};

export const getZKPTokenMarketPrice = createAsyncThunk(
    'balance/getZKPTokenMarketPrice',
    async (): Promise<string | null> => {
        const price = await stakingService.getZKPMarketPrice();
        if (price) {
            console.debug(`Fetched $ZKP market price: \$${formatEther(price)}`);
        }
        return price?.toString() ?? null;
    },
);

export const marketPriceSlice = createSlice({
    name: 'zkpMarketPrice',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(getZKPTokenMarketPrice.pending, state => {
                state.status = 'loading';
            })
            .addCase(getZKPTokenMarketPrice.fulfilled, (state, action) => {
                state.status = 'idle';
                state.value = action.payload;
            })
            .addCase(getZKPTokenMarketPrice.rejected, state => {
                state.status = 'failed';
                state.value = null;
            });
    },
});

export const marketPriceSelector = (state: RootState) => {
    return state.zkpMarketPrice.value
        ? BigNumber.from(state.zkpMarketPrice.value)
        : null;
};

export const statuszkpMarketPriceSelector = (state: RootState) =>
    state.zkpMarketPrice.status;

export default marketPriceSlice.reducer;
