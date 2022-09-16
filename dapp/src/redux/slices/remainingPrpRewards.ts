import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';

import {safeParseStringToBN} from '../../lib/numbers';
import {unusedPrpGrantAmount} from '../../services/rewards';
import {createExtraReducers, LoadingStatus} from '../slices/shared';
import {RootState} from '../store';

interface remainingPrpRewardsState {
    value: string | null;
    status: LoadingStatus;
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
        createExtraReducers({builder, asyncThunk: getRemainingPrpRewards});
    },
});

export const remainingPrpRewardsSelector = (state: RootState) => {
    return safeParseStringToBN(state.remainingPrpRewards.value);
};

export default remainingPrpRewardsSlice.reducer;
