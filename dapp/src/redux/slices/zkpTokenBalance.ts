import {BigNumber} from '@ethersproject/bignumber';
import {Web3Provider} from '@ethersproject/providers';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {Web3ReactContextInterface} from '@web3-react/core/dist/types';

import {formatCurrency} from '../../lib/format';
import {formatEther, safeParseStringToBN} from '../../lib/numbers';
import {fiatPrice} from '../../lib/tokenPrice';
import * as accountService from '../../services/account';
import {RootState} from '../store';

import {BalanceState, createExtraReducers, initialBalanceState} from './shared';
import {marketPriceSelector} from './zkpMarketPrice';

const initialState: BalanceState = initialBalanceState;

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
        reset: state => {
            state.value = initialState.value;
            state.status = initialState.status;
        },
    },
    extraReducers: builder => {
        createExtraReducers({
            builder,
            asyncThunk: getZkpTokenBalance,
        });
    },
});

export const zkpTokenBalanceSelector = (state: RootState) =>
    safeParseStringToBN(state.zkpTokenBalance.value);

export const zkpUnstakedUSDMarketPriceSelector = (
    state: RootState,
): BigNumber | null => {
    const price = marketPriceSelector(state);
    const balance = zkpTokenBalanceSelector(state);

    if (!price) {
        console.warn('unalbe to get zkp market price from oracles');
        return null;
    }

    if (!balance) {
        console.warn('unalbe to get ZKP token balance');
        return null;
    }

    const tokenUSDMarketPrice: BigNumber | null = fiatPrice(balance, price);
    console.debug(
        'tokenBalance:',
        formatEther(balance),
        `(USD \$${formatCurrency(tokenUSDMarketPrice)})`,
    );
    return tokenUSDMarketPrice;
};

export const {reset: resetZkpTokenBalance} = tokenBalanceSlice.actions;
export default tokenBalanceSlice.reducer;
