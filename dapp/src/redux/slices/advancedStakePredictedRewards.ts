import {BigNumber} from 'ethers';
// eslint-disable-next-line
import {createSlice, PayloadAction} from '@reduxjs/toolkit';

import {prpReward, zZkpReward} from '../../services/rewards';
import {StakeReward, StakingRewardTokenID} from '../../types/staking';
import {RootState} from '../store';

interface StakesRewardsState {
    value: StakeReward | null;
}

const initialState: StakesRewardsState = {value: {} as StakeReward};

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
                state.value = {} as StakeReward;
            } else {
                const timeStaked = Math.floor(new Date().getTime());
                const rewards = {
                    [StakingRewardTokenID.zZKP]: zZkpReward(
                        BigNumber.from(amountToStake),
                        timeStaked,
                    ).toString(),
                    [StakingRewardTokenID.PRP]: prpReward(
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
): StakeReward | null => {
    return state.advancedStakeInputRewards.value ?? null;
};

export const {resetRewards, calculateRewards} = calculatedRewardSlice.actions;

export default calculatedRewardSlice.reducer;
