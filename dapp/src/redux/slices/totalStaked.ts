import {BigNumber} from '@ethersproject/bignumber';
import {Web3Provider} from '@ethersproject/providers';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {Web3ReactContextInterface} from '@web3-react/core/dist/types';

import * as stakingService from '../../services/staking';
import {RootState} from '../store';

interface totalStakedState {
    value: string | null;
    status: 'idle' | 'loading' | 'failed';
}

const initialState: totalStakedState = {
    value: null,
    status: 'idle',
};

export const getTotalStaked = createAsyncThunk(
    'balance/getTotalStaked',
    async (
        context: Web3ReactContextInterface<Web3Provider>,
    ): Promise<string | null> => {
        const {library, chainId} = context;

        if (!library || !chainId) return null;
        const totalStaked = await stakingService.getTotalStaked(
            library,
            chainId,
        );
        if (!totalStaked || totalStaked instanceof Error) {
            return null;
        }

        return totalStaked.toString();
    },
);

export const stakedBalanceSlice = createSlice({
    name: 'zkpTotalStakedBalance',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder

            .addCase(getTotalStaked.pending, state => {
                state.status = 'loading';
            })
            .addCase(getTotalStaked.fulfilled, (state, action) => {
                state.status = 'idle';
                state.value = action.payload;
            })
            .addCase(getTotalStaked.rejected, state => {
                state.status = 'failed';
                state.value = null;
            });
    },
});

export const totalStakedSelector = (state: RootState) => {
    return state.totalStaked.value
        ? BigNumber.from(state.totalStaked.value)
        : null;
};
export default stakedBalanceSlice.reducer;
