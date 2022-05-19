import {BigNumber} from '@ethersproject/bignumber';
import {Web3Provider} from '@ethersproject/providers';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {Web3ReactContextInterface} from '@web3-react/core/dist/types';
import {constants} from 'ethers';

import * as accountService from '../../services/account';
import {fiatPrice, formatCurrency, formatEther} from '../../utils/helpers';
import {RootState} from '../store';

interface ZkpTokenBalanceState {
    value: string | null;
    status: 'idle' | 'loading' | 'failed';
}
const initialState: ZkpTokenBalanceState = {
    value: null,
    status: 'idle',
};

export const getZkpTokenBalance = createAsyncThunk(
    'balance/getTokenBalance',
    async (
        context: Web3ReactContextInterface<Web3Provider>,
    ): Promise<string | null> => {
        const {library, chainId, account} = context;
        if (!library || !chainId || !account) return null;

        const balance = await accountService.getTokenBalance(
            library,
            chainId,
            account,
        );

        return balance?.toString() ?? null;
    },
);

export const tokenBalanceSlice = createSlice({
    name: 'zkpTokenBalance',
    initialState,
    reducers: {
        resetZkpTokenBalance: state => {
            state.value = initialState.value;
            state.status = initialState.status;
        },
    },
    extraReducers: builder => {
        builder
            .addCase(getZkpTokenBalance.pending, state => {
                state.status = 'loading';
            })
            .addCase(getZkpTokenBalance.fulfilled, (state, action) => {
                state.status = 'idle';
                state.value = action.payload;
            })
            .addCase(getZkpTokenBalance.rejected, state => {
                state.status = 'failed';
                state.value = null;
            });
    },
});

export const zkpTokenBalanceSelector = (state: RootState) =>
    state.zkpTokenBalance.value
        ? BigNumber.from(state.zkpTokenBalance.value)
        : null;

export const zkpUnstakedUSDMarketPriceSelector = (
    state: RootState,
): BigNumber | null => {
    const price = state.zkpMarketPrice.value
        ? BigNumber.from(state.zkpMarketPrice.value)
        : null;
    const balance = state.zkpTokenBalance.value
        ? BigNumber.from(state.zkpTokenBalance.value)
        : null;
    let tokenUSDMarketPrice: BigNumber | null = null;
    if (price && balance && balance.gte(constants.Zero)) {
        tokenUSDMarketPrice = fiatPrice(balance, price);
        console.debug(
            'tokenBalance:',
            formatEther(balance),
            `(USD \$${formatCurrency(tokenUSDMarketPrice)})`,
        );
    }
    return tokenUSDMarketPrice;
};
export const {resetZkpTokenBalance} = tokenBalanceSlice.actions;
export default tokenBalanceSlice.reducer;
