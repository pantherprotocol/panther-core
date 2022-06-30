import {Web3Provider} from '@ethersproject/providers';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {Web3ReactContextInterface} from '@web3-react/core/dist/types';

import * as pool from '../../services/pool';
import {RootState} from '../store';

// TODO: index exitTime by chainId, so that we can add to the Redux persist
// whitelist and cache more aggressively to avoid unnecessary queries.
//
// Also, if we need to add other values to this slice, we'll have to add another
// level to this slice's structure, since it currently only allows for storing
// the exit time.
interface PoolV0ExitTimeState {
    value: number | null;
    status: 'idle' | 'loading' | 'failed';
}

const initialState: PoolV0ExitTimeState = {
    value: null,
    status: 'idle',
};

const getExitTime = createAsyncThunk(
    'poolV0/getExitTime',
    async (
        context: Web3ReactContextInterface<Web3Provider>,
    ): Promise<number | null> => {
        const {library, chainId} = context;
        if (!chainId || !library) {
            return null;
        }
        return await pool.getExitTime(library, chainId);
    },
);
export const getPoolV0ExitTime = getExitTime;

const poolV0Slice = createSlice({
    name: 'poolV0',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(getExitTime.pending, state => {
                state.status = 'loading';
            })
            .addCase(getExitTime.fulfilled, (state, action) => {
                state.status = 'idle';
                state.value = action.payload;
            })
            .addCase(getExitTime.rejected, state => {
                state.status = 'failed';
                state.value = null;
            });
    },
});

export const poolV0ExitTimeSelector = (state: RootState) => state.poolV0.value;

export default poolV0Slice.reducer;
