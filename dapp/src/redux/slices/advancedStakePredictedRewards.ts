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
        calculateRewards: (state, action: PayloadAction<[string, string]>) => {
            const [amountToStake, minLockPeriod] = action.payload;
            if (!amountToStake || !minLockPeriod) {
                state.value = {} as StakeReward;
            } else {
                const timeStaked = Math.floor(new Date().getTime());
                const lockedTill = timeStaked + 1000 * Number(minLockPeriod);

                const rewards = {
                    [StakingRewardTokenID.zZKP]: zZkpReward(
                        BigNumber.from(amountToStake),
                        timeStaked,
                        lockedTill,
                    ).toString(),
                    [StakingRewardTokenID.PRP]: prpReward().toString(),
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
