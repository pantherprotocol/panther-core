import {BigNumber} from '@ethersproject/bignumber';
import {Web3Provider} from '@ethersproject/providers';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {Web3ReactContextInterface} from '@web3-react/core/dist/types';
import {constants} from 'ethers';

import {formatCurrency} from '../../lib/format';
import {fiatPrice} from '../../lib/tokenPrice';
import {chainHasStakesReporter} from '../../services/contracts';
import {isClassic} from '../../services/rewards';
import * as stakingService from '../../services/staking';
import {
    StakeReward,
    AdvancedStakeRewardsBN,
    StakingRewardTokenID,
} from '../../types/staking';
import {RootState} from '../store';

interface StakesRewardsAsyncState {
    value: StakeReward | null;
    status: 'idle' | 'loading' | 'failed';
}

const initialState: StakesRewardsAsyncState = {
    value: null,
    status: 'idle',
};

export const getUnclaimedRewards = createAsyncThunk(
    'balance/getUnclaimedStakesRewards',
    async (
        context: Web3ReactContextInterface<Web3Provider>,
    ): Promise<StakeReward | null> => {
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

        const reduxRewards = {} as StakeReward;

        for (const tid of [
            StakingRewardTokenID.PRP,
            StakingRewardTokenID.ZKP,
            StakingRewardTokenID.zZKP,
        ]) {
            reduxRewards[tid] = sumTokens(reward[1], tid).toString();
        }

        return reduxRewards;
    },
);

function sumTokens(
    rows: stakingService.StakeRow[],
    tid: StakingRewardTokenID,
): BigNumber {
    let accumulated = constants.Zero;

    for (const row of rows) {
        if (tid === StakingRewardTokenID.ZKP && isClassic(row.reward)) {
            accumulated = accumulated.add(row.reward as BigNumber);
        } else if (
            (tid === StakingRewardTokenID.zZKP ||
                tid === StakingRewardTokenID.PRP) &&
            !isClassic(row.reward)
        ) {
            accumulated = accumulated.add(
                (row.reward as AdvancedStakeRewardsBN)[tid],
            );
        }
    }

    return accumulated;
}

export const unclaimedRewardsSlice = createSlice({
    name: 'unclaimedStakesRewards',
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
                state.value = {} as StakeReward;
            });
    },
});

const rewardsSelector = (
    state: RootState,
    tid: StakingRewardTokenID,
): BigNumber | null => {
    return state.unclaimedStakesRewards.value?.[tid]
        ? BigNumber.from(state.unclaimedStakesRewards.value[tid])
        : null;
};

export const zZkpUnclaimedRewardsSelector = (
    state: RootState,
): BigNumber | null => {
    return rewardsSelector(state, StakingRewardTokenID.zZKP);
};

export const prpUnclaimedRewardsSelector = (
    state: RootState,
): BigNumber | null => {
    return rewardsSelector(state, StakingRewardTokenID.PRP);
};

export const zkpUnclaimedRewardsSelector = (
    state: RootState,
): BigNumber | null => {
    return rewardsSelector(state, StakingRewardTokenID.ZKP);
};

export const zZkpTokenUSDMarketPriceSelector = (
    state: RootState,
): BigNumber | null => {
    return tokenUSDMarketPriceSelector(state, StakingRewardTokenID.zZKP);
};

export const zkpTokenUSDMarketPriceSelector = (
    state: RootState,
): BigNumber | null => {
    return tokenUSDMarketPriceSelector(state, StakingRewardTokenID.ZKP);
};

const tokenUSDMarketPriceSelector = (
    state: RootState,
    tid: StakingRewardTokenID,
): BigNumber | null => {
    const price = state.zkpMarketPrice.value
        ? BigNumber.from(state.zkpMarketPrice.value)
        : null;
    const balance = rewardsSelector(state, tid);
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

export const statusUnclaimedRewardsSelector = (
    state: RootState,
): 'idle' | 'loading' | 'failed' => {
    return state.unclaimedStakesRewards.status;
};

export const {resetUnclaimedRewards} = unclaimedRewardsSlice.actions;

export default unclaimedRewardsSlice.reducer;
