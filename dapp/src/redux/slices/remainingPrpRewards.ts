import {Web3Provider} from '@ethersproject/providers';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {Web3ReactContextInterface} from '@web3-react/core/dist/types';

import {poolContractGetUnusedGrantAmount} from '../../services/rewards';
import {RootState} from '../store';

interface remainingPrpRewardsState {
    value: string | null;
    status: 'idle' | 'loading' | 'failed';
}

const initialState: remainingPrpRewardsState = {
    value: null,
    status: 'idle',
};

export const getRemainingPrpRewards = createAsyncThunk(
    'remainingPrpRewards/get',
    async (
        context: Web3ReactContextInterface<Web3Provider>,
    ): Promise<string | null> => {
        const {library, account, chainId} = context;
        if (!account || !library || !chainId) {
            return null;
        }
        const response = await poolContractGetUnusedGrantAmount(
            library,
            account,
            chainId,
        );
        return response ? response.toString() : null;
    },
);

const remainingPrpRewardsSlice = createSlice({
    name: 'remainingPrpRewards',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(getRemainingPrpRewards.pending, state => {
                state.status = 'loading';
            })
            .addCase(getRemainingPrpRewards.fulfilled, (state, action) => {
                state.status = 'idle';
                state.value = action.payload;
            })
            .addCase(getRemainingPrpRewards.rejected, state => {
                state.status = 'failed';
                state.value = null;
            });
    },
});

export const remainingPrpRewardsSelector = (state: RootState) =>
    state.remainingPrpRewards.value;

export default remainingPrpRewardsSlice.reducer;
