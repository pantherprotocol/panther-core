import {BigNumber} from '@ethersproject/bignumber';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';

import {TokenID, prpReward, zZkpReward} from '../../services/rewards';
import {RootState} from '../store';

import {StakeRewards, StakesRewardsState} from './types';

const initialState: StakesRewardsState = {
    value: {} as StakeRewards,
    status: 'idle',
};

export const calculateRewards = createAsyncThunk(
    'calculate/rewards',
    async (amountToStakeBN: BigNumber | null): Promise<StakeRewards> => {
        if (!amountToStakeBN) return {} as StakeRewards;

        const timeStaked = Math.floor(new Date().getTime());
        const rewards = {
            [TokenID.zZKP]: zZkpReward(amountToStakeBN, timeStaked).toString(),
            [TokenID.PRP]: prpReward(amountToStakeBN).toString(),
        };

        return rewards;
    },
);

export const calculatedRewardSlice = createSlice({
    name: 'zZkpBalance',
    initialState,
    reducers: {
        resetZzkpReward: state => {
            state.value = initialState.value;
            state.status = initialState.status;
        },
    },
    extraReducers: builder => {
        builder

            .addCase(calculateRewards.pending, state => {
                state.status = 'loading';
            })
            .addCase(calculateRewards.fulfilled, (state, action) => {
                state.status = 'idle';
                state.value = action.payload;
            })
            .addCase(calculateRewards.rejected, state => {
                state.status = 'failed';
                state.value = {} as StakeRewards;
            });
    },
});

export const calculatedRewardsSelector = (
    state: RootState,
): StakeRewards | null => {
    return state.calculatedRewards.value ?? null;
};

export const {resetZzkpReward} = calculatedRewardSlice.actions;

export default calculatedRewardSlice.reducer;
