// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {BigNumber} from 'ethers';
// eslint-disable-next-line
import {createSlice, PayloadAction} from '@reduxjs/toolkit';

import {safeParseStringToBN} from 'lib/numbers';
import {RootState} from 'redux/store';
import {prpReward, zZkpReward} from 'services/rewards';
import {StakeReward, StakeRewardsBN, StakingRewardTokenID} from 'types/staking';

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
        calculate: (
            state,
            action: PayloadAction<[string, number, number, number]>,
        ) => {
            const [amountToStake, minLockPeriod, allowedSince, allowedTill] =
                action.payload;
            if (
                !amountToStake ||
                !minLockPeriod ||
                !allowedSince ||
                !allowedTill
            ) {
                state.value = {} as StakeReward;
                return;
            }

            const timeStaked = Math.floor(new Date().getTime());
            const zZkpRewards = zZkpReward(
                BigNumber.from(amountToStake),
                timeStaked,
                timeStaked + 1000 * Number(minLockPeriod),
                1000 * Number(allowedSince),
                1000 * Number(allowedTill),
            ).toString();

            const rewards = {
                [StakingRewardTokenID.zZKP]: zZkpRewards,
                [StakingRewardTokenID.PRP]: prpReward(timeStaked).toString(),
            };

            state.value = rewards;
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
