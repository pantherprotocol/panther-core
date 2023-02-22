// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {safeParseStringToBN} from 'lib/numbers';
import {LoadingStatus} from 'loading';
import {createExtraReducers} from 'redux/slices/shared';
import {RootState} from 'redux/store';
import {unusedPrpGrantAmount} from 'services/rewards';

interface remainingPrpRewardsState {
    value: string | null;
    status: LoadingStatus;
}

const initialState: remainingPrpRewardsState = {
    value: null,
    status: 'idle',
};

export const getRemainingPrpRewards = createAsyncThunk(
    'staking/rewards/remainingPRP',
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
    return safeParseStringToBN(state.staking.remainingPrpRewards.value);
};

export default remainingPrpRewardsSlice.reducer;
