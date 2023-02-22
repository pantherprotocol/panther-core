// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {BigNumber} from '@ethersproject/bignumber';
import {Web3Provider} from '@ethersproject/providers';
import {sumBigNumbers} from '@panther-core/crypto/lib/utils/numbers';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {Web3ReactContextInterface} from '@web3-react/core/dist/types';
import {safeParseStringToBN} from 'lib/numbers';
import {LoadingStatus} from 'loading';
import {createExtraReducers} from 'redux/slices/shared';
import {RootState} from 'redux/store';
import {isClassic} from 'services/rewards';
import * as stakingService from 'services/staking';

interface TotalClassicRewardsState {
    value: string | null;
    status: LoadingStatus;
}

const initialState: TotalClassicRewardsState = {
    value: null,
    status: 'idle',
};

export const getTotalUnclaimedClassicRewards = createAsyncThunk(
    'staking/rewards/classic/unclaimed',
    async (
        context: Web3ReactContextInterface<Web3Provider>,
    ): Promise<string | null> => {
        const {account, library, chainId} = context;
        if (!library || !chainId || !account) return null;

        const reward = await stakingService.getStakesAndRewards(
            library,
            chainId,
            account,
        );

        const rewards = reward[1]
            .filter((row: stakingService.StakeRow) => {
                return isClassic(row.reward);
            })
            .map((stake: stakingService.StakeRow) => stake.reward as BigNumber);
        return sumBigNumbers(rewards).toString();
    },
);

export const totalUnclaimedClassicRewardsSlice = createSlice({
    name: 'totalUnclaimedClassicRewards',
    initialState,
    reducers: {
        reset: state => {
            state.value = initialState.value;
            state.status = initialState.status;
        },
    },
    extraReducers: builder => {
        createExtraReducers({
            builder,
            asyncThunk: getTotalUnclaimedClassicRewards,
        });
    },
});

export const totalUnclaimedClassicRewardsSelector = (
    state: RootState,
): BigNumber | null => {
    return safeParseStringToBN(
        state.staking.totalUnclaimedClassicRewards.value,
    );
};

export const statusUnclaimedRewardsSelector = (
    state: RootState,
): LoadingStatus => {
    return state.staking.totalUnclaimedClassicRewards.status;
};

export const {reset: resetUnclaimedClassicRewards} =
    totalUnclaimedClassicRewardsSlice.actions;

export default totalUnclaimedClassicRewardsSlice.reducer;
