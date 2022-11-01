import {BigNumber} from 'ethers';
// eslint-disable-next-line
import {createSlice, PayloadAction} from '@reduxjs/toolkit';

import {safeParseStringToBN} from '../../../lib/numbers';
import {prpReward, zZkpReward} from '../../../services/rewards';
import {
    StakeReward,
    StakeRewardsBN,
    StakingRewardTokenID,
} from '../../../types/staking';
import {RootState} from '../../store';

interface StakesRewardsState {
    value: StakeReward | null;
}

const initialState: StakesRewardsState = {value: {} as StakeReward};

export const calculatedRewardSlice = createSlice({
    name: 'staking/advancedStakeInputRewards',
    initialState,
    reducers: {
        reset: (state): void => {
            state.value = {};
        },
        calculate: (state, action: PayloadAction<[string, string]>) => {
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
): StakeRewardsBN | null => {
    const data = state.staking.advancedStakeInputRewards.value;
    if (!data) return null;
    const dataBN = {} as StakeRewardsBN;

    Object.keys(data).forEach(_key => {
        const key = _key as keyof StakeReward;
        dataBN[key] = safeParseStringToBN(data[key]);
        return dataBN;
    });

    return dataBN;
};

export const {reset: resetRewards, calculate: calculateRewards} =
    calculatedRewardSlice.actions;

export default calculatedRewardSlice.reducer;
