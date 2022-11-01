import {Web3Provider} from '@ethersproject/providers';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {Web3ReactContextInterface} from '@web3-react/core/dist/types';

import {safeParseStringToBN} from '../../../lib/numbers';
import {RootState} from '../../store';
import {
    BalanceState,
    createExtraReducers,
    initialBalanceState,
} from '../shared';

const initialState: BalanceState = initialBalanceState;

export const getChainBalance = createAsyncThunk(
    'wallet/balance/chain/Tokens',
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
    name: 'wallet/chainBalance',
    initialState,
    reducers: {
        reset: state => {
            state.value = initialState.value;
            state.status = initialState.status;
        },
    },
    extraReducers: builder => {
        createExtraReducers({builder, asyncThunk: getChainBalance});
    },
});

export const chainBalanceSelector = (state: RootState) =>
    safeParseStringToBN(state.wallet.chainBalance.value);

export const {reset: resetChainBalance} = chainBalanceSlice.actions;
export default chainBalanceSlice.reducer;
