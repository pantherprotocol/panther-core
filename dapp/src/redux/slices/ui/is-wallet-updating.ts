// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

// eslint-disable-next-line
import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {RootState} from 'redux/store';

export interface isWalletUpdatingState {
    value: boolean;
}

const initialState: isWalletUpdatingState = {
    value: false,
};

export const isWalletUpdatingSlice = createSlice({
    name: 'ui/isWalletUpdating',
    initialState,
    reducers: {
        setWalletUpdating: (state, action: PayloadAction<boolean>) => {
            state.value = action.payload;
        },
    },
});

export const {setWalletUpdating} = isWalletUpdatingSlice.actions;

export const isWalletUpdatingSelector = (state: RootState) => {
    return state.ui.isWalletUpdating?.value;
};

export default isWalletUpdatingSlice.reducer;
