import {BigNumber} from '@ethersproject/bignumber';
// eslint-disable-next-line
import {createSlice, PayloadAction} from '@reduxjs/toolkit';

import {TokenID, prpReward, zZkpReward} from '../../services/rewards';
import {RootState} from '../store';

import {StakeRewards, StakesRewardsState} from './types';

const initialState: StakesRewardsState = {
    value: {} as StakeRewards,
};

export const calculatedRewardSlice = createSlice({
    name: 'zZkpBalance',
    initialState,
    reducers: {
        resetZzkpReward: state => {
            state.value = initialState.value;
        },
        calculateRewards: (state, action: PayloadAction<BigNumber>) => {
            const amountToStakeBN = action.payload;
            if (!amountToStakeBN) {
                state.value = {} as StakeRewards;
            } else {
                const timeStaked = Math.floor(new Date().getTime());
                const rewards = {
                    [TokenID.zZKP]: zZkpReward(
                        amountToStakeBN,
                        timeStaked,
                    ).toString(),
                    [TokenID.PRP]: prpReward(amountToStakeBN).toString(),
                };

                state.value = rewards;
            }
        },
    },
});

export const calculatedRewardsSelector = (
    state: RootState,
): StakeRewards | null => {
    return state.calculatedRewards.value ?? null;
};

export const {resetZzkpReward, calculateRewards} =
    calculatedRewardSlice.actions;

export default calculatedRewardSlice.reducer;
