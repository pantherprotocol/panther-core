import {Web3Provider} from '@ethersproject/providers';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {Web3ReactContextInterface} from '@web3-react/core/dist/types';

import {getZKPTokenMarketPrice} from '../../redux/slices/zkpMarketPrice';
import {ZAsset} from '../../types/assets';
import {RootState} from '../store';

import {
    zZkpUnclaimedRewardsSelector,
    prpUnclaimedRewardsSelector,
    getUnclaimedRewards,
    zZkpTokenUSDMarketPriceSelector,
} from './unclaimedStakesRewards';

interface AssetsState {
    value: ZAsset[] | null;
    status: 'idle' | 'loading' | 'failed';
}
const initialState: AssetsState = {
    value: null,
    status: 'idle',
};

export const getAssets = createAsyncThunk(
    'balance/getAssets',
    async (
        context: Web3ReactContextInterface<Web3Provider>,
        {getState, dispatch},
    ): Promise<ZAsset[] | null> => {
        const {account, library, chainId} = context;
        if (!library || !account || !chainId) return null;

        await dispatch(getZKPTokenMarketPrice());
        await dispatch(getUnclaimedRewards(context));
        const state = getState() as RootState;
        const value = zZkpUnclaimedRewardsSelector(state)?.toString() ?? '0';
        const prpAmount = prpUnclaimedRewardsSelector(state)?.toString() ?? '0';
        const usdValue =
            zZkpTokenUSDMarketPriceSelector(state)?.toString() ?? '0';

        const assets: ZAsset[] = [
            {
                name: 'zZKP',
                value,
                prpAmount,
                usdValue,
                hasMenu: false,
            },
        ];
        return assets;
    },
);

export const assetsSlice = createSlice({
    name: 'assets',
    initialState,
    reducers: {
        resetAssets: state => {
            state.value = initialState.value;
            state.status = initialState.status;
        },
    },
    extraReducers: builder => {
        builder
            .addCase(getAssets.pending, state => {
                state.status = 'loading';
            })
            .addCase(getAssets.fulfilled, (state, action) => {
                state.status = 'idle';
                state.value = action.payload;
            })
            .addCase(getAssets.rejected, state => {
                state.status = 'failed';
                state.value = null;
            });
    },
});

export const assetsSelector = (state: RootState) => {
    return state.assets.value ?? null;
};

export const {resetAssets} = assetsSlice.actions;

export default assetsSlice.reducer;
