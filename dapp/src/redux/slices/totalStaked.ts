import {BigNumber} from '@ethersproject/bignumber';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';

import * as stakingService from '../../services/staking';
import {RootState} from '../store';

interface totalStakedState {
    value: string | null;
    status: 'idle' | 'loading' | 'failed';
}

const initialState: totalStakedState = {
    value: null,
    status: 'idle',
};

export const getTotalStaked = createAsyncThunk(
    'balance/getTotalStaked',
    async (): Promise<string | null> => {
        const totalStaked = await stakingService.getSumAllAdvancedStakes();
        if (!totalStaked || totalStaked instanceof Error) {
            return null;
        }

        return totalStaked.toString();
    },
);

export const stakedBalanceSlice = createSlice({
    name: 'zkpTotalStakedBalance',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(getTotalStaked.pending, state => {
                state.status = 'loading';
            })
            .addCase(getTotalStaked.fulfilled, (state, action) => {
                state.status = 'idle';
                state.value = action.payload;
            })
            .addCase(getTotalStaked.rejected, state => {
                state.status = 'failed';
                state.value = null;
            });
    },
});

export const totalStakedSelector = (state: RootState) => {
    return state.totalStaked.value
        ? BigNumber.from(state.totalStaked.value)
        : null;
};
export default stakedBalanceSlice.reducer;
