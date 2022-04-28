import {BigNumber} from '@ethersproject/bignumber';
import {Web3Provider} from '@ethersproject/providers';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {Web3ReactContextInterface} from '@web3-react/core/dist/types';
import {constants} from 'ethers';

import {chainHasStakesReporter} from '../../services/contracts';
import * as stakingService from '../../services/staking';
import {formatCurrency, fiatPrice} from '../../utils/helpers';
import {RootState} from '../store';

interface UnclaimedRewardsState {
    value: string | null;
    status: 'idle' | 'loading' | 'failed';
}
const initialState: UnclaimedRewardsState = {
    value: null,
    status: 'idle',
};

export const getUnclaimedRewards = createAsyncThunk(
    'balance/getUnclaimedRewards',
    async (
        context: Web3ReactContextInterface<Web3Provider>,
        {getState},
    ): Promise<string | null> => {
        const {account, library, chainId} = context;
        if (!library || !chainId || !account) return null;
        if (chainHasStakesReporter(chainId)) {
            if (chainId === 137) {
                console.debug('Using StakesReporter on Polygon');
            } else {
                console.debug('Using StakesReporter on chain', chainId);
            }
        } else {
            console.debug('Not using StakesReporter; chainId', chainId);
        }

        const rewardsBalance = await stakingService.getRewardsBalance(
            library,
            chainId,
            account,
        );
        const state = getState() as RootState;
        const price = state.zkpMarketPrice.value
            ? BigNumber.from(state.zkpMarketPrice.value)
            : null;

        if (rewardsBalance && rewardsBalance.gt(constants.Zero)) {
            console.debug(
                'rewardsBalance:',
                formatCurrency(rewardsBalance),
                `(USD \$${formatCurrency(fiatPrice(rewardsBalance, price))})`,
            );
        }
        return rewardsBalance?.toString() ?? null;
    },
);

export const unclaimedRewardsSlice = createSlice({
    name: 'zkpUnclaimedReward',
    initialState,
    reducers: {
        resetUnclaimedRewards: state => {
            state.value = initialState.value;
            state.status = initialState.status;
        },
    },
    extraReducers: builder => {
        builder

            .addCase(getUnclaimedRewards.pending, state => {
                state.status = 'loading';
            })
            .addCase(getUnclaimedRewards.fulfilled, (state, action) => {
                state.status = 'idle';
                state.value = action.payload;
            })
            .addCase(getUnclaimedRewards.rejected, state => {
                state.status = 'failed';
                state.value = null;
            });
    },
});

export const unclaimedRewardsSelector = (state: RootState) => {
    return state.unclaimedRewards.value
        ? BigNumber.from(state.unclaimedRewards.value)
        : null;
};

export const zkpTokenUSDMarketPriceSelector = (
    state: RootState,
): BigNumber | null => {
    const price = state.zkpMarketPrice.value
        ? BigNumber.from(state.zkpMarketPrice.value)
        : null;
    const balance = state.unclaimedRewards.value
        ? BigNumber.from(state.unclaimedRewards.value)
        : null;
    const rewardsUSDValue: BigNumber | null = fiatPrice(balance, price);
    if (balance) {
        console.debug(
            'rewardsBalance:',
            formatCurrency(balance),
            `(USD \$${formatCurrency(rewardsUSDValue)})`,
        );
    }
    return rewardsUSDValue;
};

export const {resetUnclaimedRewards} = unclaimedRewardsSlice.actions;

export default unclaimedRewardsSlice.reducer;
