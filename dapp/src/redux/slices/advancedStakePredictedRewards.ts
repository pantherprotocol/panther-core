import {BigNumber} from 'ethers';
// eslint-disable-next-line
import {createSlice, PayloadAction} from '@reduxjs/toolkit';

import {prpReward, zZkpReward, TokenID} from '../../services/rewards';
import {StakeRewards} from '../../types/staking';
import {RootState} from '../store';

interface StakesRewardsState {
    value: StakeRewards | null;
}

const initialState: StakesRewardsState = {value: {} as StakeRewards};

export const calculatedRewardSlice = createSlice({
    name: 'advancedStakeInputRewards',
    initialState,
    reducers: {
        resetRewards: (state): void => {
            state.value = {};
        },
        calculateRewards: (state, action: PayloadAction<string>) => {
            const amountToStake = action.payload;
            if (!amountToStake) {
                state.value = {} as StakeRewards;
            } else {
                const timeStaked = Math.floor(new Date().getTime());
                const rewards = {
                    [TokenID.zZKP]: zZkpReward(
                        BigNumber.from(amountToStake),
                        timeStaked,
                    ).toString(),
                    [TokenID.PRP]: prpReward(
                        BigNumber.from(amountToStake),
                    ).toString(),
                };

                state.value = rewards;
            }
        },
    },
});

export const calculatedRewardsSelector = (
    state: RootState,
): StakeRewards | null => {
    return state.advancedStakeInputRewards.value ?? null;
};

export const {resetRewards, calculateRewards} = calculatedRewardSlice.actions;

export default calculatedRewardSlice.reducer;
