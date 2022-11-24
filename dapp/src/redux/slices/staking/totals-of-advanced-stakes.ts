// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {safeParseStringToBN} from 'lib/numbers';
import {createExtraReducers, LoadingStatus} from 'redux/slices/shared';
import {RootState} from 'redux/store';
import {rewardsVested, rewardsClaimed} from 'services/rewards';
import {ZKP_STAKED_SCALING_FACTOR} from 'services/staking';

type AdvancedStakingState = {
    staked?: string;
    vestedRewards?: string;
    claimedRewards?: string;
};

interface totalsOfAdvancedStakesState {
    value: AdvancedStakingState | null;
    status: LoadingStatus;
}

const initialState: totalsOfAdvancedStakesState = {
    value: null,
    status: 'idle',
};

export const getTotalsOfAdvancedStakes = createAsyncThunk(
    'staking/advanced/total',
    async (): Promise<AdvancedStakingState | null> => {
        const totals: AdvancedStakingState = {};

        const claimed = await rewardsClaimed();
        if (claimed instanceof Error) {
            return totals;
        }
        totals.staked = ZKP_STAKED_SCALING_FACTOR.mul(
            claimed.scZkpStaked,
        ).toString();

        totals.claimedRewards = claimed.zkpRewards.toString();

        const vested = await rewardsVested();
        if (!vested || vested instanceof Error) {
            return totals;
        }
        totals.vestedRewards = vested.zkpRewards.toString();

        return totals;
    },
);

export const stakedBalanceSlice = createSlice({
    name: 'zkpTotalStakedBalance',
    initialState,
    reducers: {},
    extraReducers: builder => {
        createExtraReducers({builder, asyncThunk: getTotalsOfAdvancedStakes});
    },
});

export const totalStakedSelector = (state: RootState) => {
    return state.staking.totalsOfAdvancedStakes.value
        ? safeParseStringToBN(state.staking.totalsOfAdvancedStakes.value.staked)
        : null;
};

export const totalClaimedRewardsSelector = (state: RootState) => {
    return state.staking.totalsOfAdvancedStakes.value
        ? safeParseStringToBN(
              state.staking.totalsOfAdvancedStakes.value.claimedRewards,
          )
        : null;
};

export const totalVestedRewardsSelector = (state: RootState) => {
    return safeParseStringToBN(
        state.staking.totalsOfAdvancedStakes.value?.vestedRewards,
    );
};

export default stakedBalanceSlice.reducer;
