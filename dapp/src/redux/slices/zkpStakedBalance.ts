import {BigNumber} from '@ethersproject/bignumber';
import {Web3Provider} from '@ethersproject/providers';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {Web3ReactContextInterface} from '@web3-react/core/dist/types';

import * as stakingService from '../../services/staking';
import {RootState} from '../store';

interface ZkpStakedBalanceState {
    value: string | null;
    status: 'idle' | 'loading' | 'failed';
}
const initialState: ZkpStakedBalanceState = {
    value: null,
    status: 'idle',
};

export const getZkpStakedBalance = createAsyncThunk(
    'balance/getZkpStaked',
    async (
        context: Web3ReactContextInterface<Web3Provider>,
    ): Promise<string | null> => {
        const {account, library, chainId} = context;

        if (!library || !account || !chainId) return null;
        const totalStaked = await stakingService.getTotalStakedForAccount(
            library,
            chainId,
            account,
        );
        return totalStaked?.toString() ?? null;
    },
);

export const stakedBalanceSlice = createSlice({
    name: 'zkpStakedBalance',
    initialState,
    reducers: {
        resetZkpStakedBalance: state => {
            state.value = initialState.value;
            state.status = initialState.status;
        },
    },
    extraReducers: builder => {
        builder
            .addCase(getZkpStakedBalance.pending, state => {
                state.status = 'loading';
            })
            .addCase(getZkpStakedBalance.fulfilled, (state, action) => {
                state.status = 'idle';
                state.value = action.payload;
            })
            .addCase(getZkpStakedBalance.rejected, state => {
                state.status = 'failed';
                state.value = null;
            });
    },
});

export const zkpStakedBalanceSelector = (state: RootState) =>
    state.zkpStakedBalance.value
        ? BigNumber.from(state.zkpStakedBalance.value)
        : null;

export const {resetZkpStakedBalance} = stakedBalanceSlice.actions;
export default stakedBalanceSlice.reducer;
