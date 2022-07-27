import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';

import {unusedPrpGrantAmount} from '../../services/rewards';
import {RootState} from '../store';

interface remainingPrpRewardsState {
    value: string | null;
    status: 'idle' | 'loading' | 'failed';
}

const initialState: remainingPrpRewardsState = {
    value: null,
    status: 'idle',
};

export const getRemainingPrpRewards = createAsyncThunk(
    'remainingPrpRewards/get',
    async (): Promise<string | null> => {
        const response = await unusedPrpGrantAmount();
        return response ? response.toString() : null;
    },
);

const remainingPrpRewardsSlice = createSlice({
    name: 'remainingPrpRewards',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(getRemainingPrpRewards.pending, state => {
                state.status = 'loading';
            })
            .addCase(getRemainingPrpRewards.fulfilled, (state, action) => {
                state.status = 'idle';
                state.value = action.payload;
            })
            .addCase(getRemainingPrpRewards.rejected, state => {
                state.status = 'failed';
                state.value = null;
            });
    },
});

export const remainingPrpRewardsSelector = (state: RootState) =>
    state.remainingPrpRewards.value;

export default remainingPrpRewardsSlice.reducer;
