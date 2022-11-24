// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {Web3Provider} from '@ethersproject/providers';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {Web3ReactContextInterface} from '@web3-react/core/dist/types';

import {MaspChainIds} from '../../../services/connectors';
import {MASP_CHAIN_ID} from '../../../services/env';
import * as pool from '../../../services/pool';
import {RootState} from '../../store';
import {createExtraReducers, LoadingStatus} from '../shared';

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
    'poolV0/exitTime',
    async (
        context: Web3ReactContextInterface<Web3Provider>,
    ): Promise<PoolV0Parameters | null> => {
        const {library, chainId} = context;
        if (!chainId || !library) {
            return {};
        }

        const exitTime = await pool.getExitTime(
            library,
            MASP_CHAIN_ID as MaspChainIds,
        );
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
    return state?.wallet.poolV0?.value?.exitTime;
};

export const poolV0ExitDelaySelector = (
    state: RootState,
): number | undefined => {
    return state.wallet.poolV0.value.exitDelay;
};

export default poolV0Slice.reducer;
