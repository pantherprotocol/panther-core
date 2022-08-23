import {createSlice} from '@reduxjs/toolkit';

import {RootState} from '../store';

export interface isWalletConnectedState {
    value: boolean;
}

const initialState: isWalletConnectedState = {
    value: false,
};

export const isWalletConnectedSlice = createSlice({
    name: 'isWalletConnected',
    initialState,
    reducers: {
        connectWallet: state => {
            state.value = true;
        },
        disconnectWallet: state => {
            state.value = false;
        },
    },
});

export const {connectWallet, disconnectWallet} = isWalletConnectedSlice.actions;

export const isWalletConnectedSelector = (state: RootState): boolean => {
    return state.isWalletConnected?.value;
};

export default isWalletConnectedSlice.reducer;
