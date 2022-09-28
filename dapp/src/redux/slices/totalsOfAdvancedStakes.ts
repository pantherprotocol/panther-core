import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';

import {safeParseStringToBN} from '../../lib/numbers';
import {rewardsVested, rewardsClaimed} from '../../services/rewards';
import {getSumAllAdvancedStakes} from '../../services/staking';
import {createExtraReducers, LoadingStatus} from '../slices/shared';
import {RootState} from '../store';

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
    'getTotalsOfAdvancedStakes',
    async (): Promise<AdvancedStakingState | null> => {
        const totals: AdvancedStakingState = {};

        const totalStaked = await getSumAllAdvancedStakes();
        if (!totalStaked || totalStaked instanceof Error) {
            return totals;
        }
        totals.staked = totalStaked.toString();

        const vested = await rewardsVested();
        if (!vested || vested instanceof Error) {
            return totals;
        }
        totals.vestedRewards = vested.toString();

        const claimed = await rewardsClaimed();
        if (!claimed || claimed instanceof Error) {
            return totals;
        }
        totals.claimedRewards = claimed.toString();

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
    return state.totalsOfAdvancedStakes.value
        ? safeParseStringToBN(state.totalsOfAdvancedStakes.value.staked)
        : null;
};

export const totalClaimedRewardsSelector = (state: RootState) => {
    return state.totalsOfAdvancedStakes.value
        ? safeParseStringToBN(state.totalsOfAdvancedStakes.value.claimedRewards)
        : null;
};

export const totalVestedRewardsSelector = (state: RootState) => {
    return safeParseStringToBN(
        state.totalsOfAdvancedStakes.value?.vestedRewards,
    );
};

export default stakedBalanceSlice.reducer;
