import {BigNumber} from '@ethersproject/bignumber';
import {Web3Provider} from '@ethersproject/providers';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {Web3ReactContextInterface} from '@web3-react/core/dist/types';

import {RootState} from '../store';

interface ChainBalanceState {
    value: string | null;
    status: 'idle' | 'loading' | 'failed';
}

const initialState: ChainBalanceState = {
    value: null,
    status: 'idle',
};

export const getChainBalance = createAsyncThunk(
    'balance/getChainBalance',
    async (
        context: Web3ReactContextInterface<Web3Provider>,
    ): Promise<string | null> => {
        const {library, account} = context;
        if (!account || !library) {
            return null;
        }
        const response = await library.getBalance(account);
        return response.toString();
    },
);

const chainBalanceSlice = createSlice({
    name: 'chainBalance',
    initialState,
    reducers: {
        resetChainBalance: state => {
            state.value = initialState.value;
            state.status = initialState.status;
        },
    },
    extraReducers: builder => {
        builder
            .addCase(getChainBalance.pending, state => {
                state.status = 'loading';
            })
            .addCase(getChainBalance.fulfilled, (state, action) => {
                state.status = 'idle';
                state.value = action.payload;
            })
            .addCase(getChainBalance.rejected, state => {
                state.status = 'failed';
                state.value = null;
            });
    },
});

export const chainBalanceSelector = (state: RootState) =>
    BigNumber.from(state.chainBalance.value ?? '0');

export const {resetChainBalance} = chainBalanceSlice.actions;
export default chainBalanceSlice.reducer;
