// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

// eslint-disable-next-line
import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {safeParseUnits} from 'lib/numbers';
import {RootState} from 'redux/store';
import {MultiError} from 'services/errors';

interface StakeAmountState {
    value: string;
}

const initialState: StakeAmountState = {
    value: '',
};

export const stakeAmountSlice = createSlice({
    name: 'staking/stakeAmount',
    initialState,
    reducers: {
        set: (state, action: PayloadAction<string>): void => {
            if (!safeParseUnits(action.payload))
                throw new MultiError(
                    `The value ${action.payload} isn't parsiable as Bignumber`,
                );

            state.value = action.payload;
        },
        reset: state => {
            state.value = initialState.value;
        },
    },
});

export const stakeAmountSelector = (state: RootState): string => {
    return state.staking.stakeAmount.value;
};

export const {set: setStakeAmount, reset: resetStakeAmount} =
    stakeAmountSlice.actions;

export default stakeAmountSlice.reducer;
