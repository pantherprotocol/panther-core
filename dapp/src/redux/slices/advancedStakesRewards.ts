import {Web3Provider} from '@ethersproject/providers';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {Web3ReactContextInterface} from '@web3-react/core/dist/types';
import {BigNumber, constants} from 'ethers';

import {getAdvancedStakingReward} from '../../services/staking';
import {AdvancedStakeRewardsResponse} from '../../services/subgraph';
import {AdvancedStakeRewards, AdvancedStakeTokenIDs} from '../../types/staking';
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
        const {account} = context;
        if (!account) return [];

        let rewards;
        try {
            rewards = await getAdvancedStakingReward(account);
        } catch (error) {
            console.error(error);
            return [];
        }

        if (!rewards) return [];
        if (!rewards.staker) return [];

        const advancedRewards: AdvancedStakeRewards[] =
            rewards.staker.advancedStakingRewards.map(
                (r: AdvancedStakeRewardsResponse) => {
                    return {
                        id: r.id,
                        creationTime: r.creationTime.toString(),
                        commitments: r.commitments,
                        utxoData: r.utxoData,
                        utxoIsSpent: false,
                        zZKP: r.zZkpAmount,
                        PRP: r.prpAmount,
                    };
                },
            );

        // TODO: check if Nullifier spent for each adv. stake
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
        markRewardsAsSpent: (state, action) => {
            const id = action.payload;
            const reward = state.value.find(r => r.id === id);
            if (reward) {
                reward.utxoIsSpent = true;
            }
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

export const {resetAdvancedStakesRewards, markRewardsAsSpent} =
    advancedStakesRewardsSlice.actions;

export default advancedStakesRewardsSlice.reducer;
