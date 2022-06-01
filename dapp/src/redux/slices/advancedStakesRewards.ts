import {Web3Provider} from '@ethersproject/providers';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {Web3ReactContextInterface} from '@web3-react/core/dist/types';
import {BigNumber, constants} from 'ethers';

import {zZkpReward, prpReward} from '../../services/rewards';
import {
    StakeRow,
    getStakesAndRewards,
    ADVANCED_TYPE_HEX,
} from '../../services/staking';
import {
    AdvancedStakeRewards,
    StakingRewardTokenID,
    AdvancedStakeTokenIDs,
} from '../../types/staking';
import {RootState} from '../store';

interface AdvancedStakesRewardsState {
    value: AdvancedStakeRewards[];
    status: 'idle' | 'loading' | 'failed';
}

const initialState: AdvancedStakesRewardsState = {
    value: [],
    status: 'idle',
};

export const getAdvancedStakesRewards = createAsyncThunk(
    'advancedStakesRewards/get',
    async (
        context: Web3ReactContextInterface<Web3Provider>,
    ): Promise<AdvancedStakeRewards[]> => {
        const {account, library, chainId} = context;
        if (!library || !chainId || !account) return [];

        const [_, stakeRows] = await getStakesAndRewards(
            library,
            chainId,
            account,
        );

        const advancedRewards: AdvancedStakeRewards[] = stakeRows
            .filter((stake: StakeRow) => {
                return stake.stakeType === ADVANCED_TYPE_HEX;
            })
            .map((stake: StakeRow) => {
                return {
                    [StakingRewardTokenID.zZKP]: zZkpReward(
                        stake.amount,
                        stake.stakedAt * 1000,
                    ).toString(),
                    [StakingRewardTokenID.PRP]: prpReward(
                        stake.amount,
                    ).toString(),
                };
            });

        return advancedRewards;
    },
);

export const advancedStakesRewardsSlice = createSlice({
    name: 'advancedStakesRewards',
    initialState,
    reducers: {
        resetAdvancedStakesRewards: state => {
            state.value = initialState.value;
            state.status = initialState.status;
        },
    },
    extraReducers: builder => {
        builder
            .addCase(getAdvancedStakesRewards.pending, state => {
                state.status = 'loading';
            })
            .addCase(getAdvancedStakesRewards.fulfilled, (state, action) => {
                state.status = 'idle';
                state.value = action.payload;
            })
            .addCase(getAdvancedStakesRewards.rejected, state => {
                state.status = 'failed';
                state.value = [];
            });
    },
});

export const advancedStakesRewardsSelector = (
    state: RootState,
): AdvancedStakeRewards[] => {
    return state.advancedStakesRewards.value;
};

export function totalSelector(
    tid: AdvancedStakeTokenIDs,
): (state: RootState) => BigNumber | null {
    return (state: RootState): BigNumber | null => {
        return advancedStakesRewardsSelector(state)
            .map((reward: AdvancedStakeRewards) => {
                return reward[tid];
            })
            .reduce((acc: BigNumber, v) => acc.add(v), constants.Zero);
    };
}

export const {resetAdvancedStakesRewards} = advancedStakesRewardsSlice.actions;

export default advancedStakesRewardsSlice.reducer;
