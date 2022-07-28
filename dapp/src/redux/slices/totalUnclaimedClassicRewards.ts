import {BigNumber} from '@ethersproject/bignumber';
import {Web3Provider} from '@ethersproject/providers';
import {sumBigNumbers} from '@panther-core/crypto/lib/numbers';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {Web3ReactContextInterface} from '@web3-react/core/dist/types';

import {chainHasStakesReporter} from '../../services/contracts';
import {isClassic} from '../../services/rewards';
import * as stakingService from '../../services/staking';
import {RootState} from '../store';

interface TotalClassicRewardsState {
    value: string | null;
    status: 'idle' | 'loading' | 'failed';
}

const initialState: TotalClassicRewardsState = {
    value: null,
    status: 'idle',
};

export const getTotalUnclaimedClassicRewards = createAsyncThunk(
    'getUnclaimedClassicStakesRewards',
    async (
        context: Web3ReactContextInterface<Web3Provider>,
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

        const reward = await stakingService.getStakesAndRewards(
            library,
            chainId,
            account,
        );

        const rewards = reward[1]
            .filter((row: stakingService.StakeRow) => {
                return isClassic(row.reward);
            })
            .map((stake: stakingService.StakeRow) => stake.reward as BigNumber);
        return sumBigNumbers(rewards).toString();
    },
);

export const totalUnclaimedClassicRewardsSlice = createSlice({
    name: 'totalUnclaimedClassicRewards',
    initialState,
    reducers: {
        resetUnclaimedClassicRewards: state => {
            state.value = initialState.value;
            state.status = initialState.status;
        },
    },
    extraReducers: builder => {
        builder
            .addCase(getTotalUnclaimedClassicRewards.pending, state => {
                state.status = 'loading';
            })
            .addCase(
                getTotalUnclaimedClassicRewards.fulfilled,
                (state, action) => {
                    state.status = 'idle';
                    state.value = action.payload;
                },
            )
            .addCase(getTotalUnclaimedClassicRewards.rejected, state => {
                state.status = 'failed';
                state.value = null;
            });
    },
});

export const totalUnclaimedClassicRewardsSelector = (
    state: RootState,
): BigNumber | null => {
    return state.totalUnclaimedClassicRewards.value
        ? BigNumber.from(state.totalUnclaimedClassicRewards.value)
        : null;
};

export const statusUnclaimedRewardsSelector = (
    state: RootState,
): 'idle' | 'loading' | 'failed' => {
    return state.totalUnclaimedClassicRewards.status;
};

export const {resetUnclaimedClassicRewards} =
    totalUnclaimedClassicRewardsSlice.actions;

export default totalUnclaimedClassicRewardsSlice.reducer;
