import {Web3Provider} from '@ethersproject/providers';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {Web3ReactContextInterface} from '@web3-react/core/dist/types';

import * as pool from '../../services/pool';
import {createExtraReducers, LoadingStatus} from '../slices/shared';
import {RootState} from '../store';

interface PoolV0ExitTimeState {
    value: PoolV0Parameters;
    status: LoadingStatus;
}

interface PoolV0Parameters {
    exitTime?: number;
    exitDelay?: number;
}

const initialState: PoolV0ExitTimeState = {
    value: {} as PoolV0Parameters,
    status: 'idle',
};

const getExitTime = createAsyncThunk(
    'poolV0/getExitTime',
    async (
        context: Web3ReactContextInterface<Web3Provider>,
    ): Promise<PoolV0Parameters | null> => {
        const {library, chainId} = context;
        if (!chainId || !library) {
            return {};
        }
        const exitTime = await pool.getExitTime(library, chainId);
        const exitDelay = await pool.getExitDelay(library, chainId);
        return {exitTime, exitDelay};
    },
);
export const getPoolV0ExitTime = getExitTime;

const poolV0Slice = createSlice({
    name: 'poolV0',
    initialState,
    reducers: {},
    extraReducers: builder => {
        createExtraReducers({builder, asyncThunk: getExitTime});
    },
});

export const poolV0ExitTimeSelector = (
    state: RootState,
): number | undefined => {
    return state?.poolV0?.value?.exitTime;
};

export const poolV0ExitDelaySelector = (
    state: RootState,
): number | undefined => {
    return state.poolV0.value.exitDelay;
};

export default poolV0Slice.reducer;
