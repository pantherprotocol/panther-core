import {createSlice} from '@reduxjs/toolkit';
import {RootState} from 'redux/store';

export interface isWalletConnectedState {
    value: boolean;
}

const initialState: isWalletConnectedState = {
    value: false,
};

export const isWalletConnectedSlice = createSlice({
    name: 'ui/walletConnection',
    initialState,
    reducers: {
        setConnected: state => {
            state.value = true;
        },
        setDisconnected: state => {
            state.value = false;
        },
    },
});

export const {setConnected, setDisconnected} = isWalletConnectedSlice.actions;

export const isWalletConnectedSelector = (state: RootState): boolean => {
    return state.ui.isWalletConnected?.value;
};

export default isWalletConnectedSlice.reducer;
