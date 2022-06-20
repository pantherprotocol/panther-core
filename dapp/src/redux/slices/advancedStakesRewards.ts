import {Web3Provider} from '@ethersproject/providers';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {Web3ReactContextInterface} from '@web3-react/core/dist/types';
import {poseidon} from 'circomlibjs';
import {BigNumber, constants} from 'ethers';

import {getChangedUTXOsStatuses, UTXOStatusByID} from '../../services/pool';
import {getAdvancedStakingReward} from '../../services/staking';
import {AdvancedStakeRewardsResponse} from '../../services/subgraph';
import {
    AdvancedStakeRewards,
    AdvancedStakeTokenIDs,
    UTXOStatus,
} from '../../types/staking';
import {RootState} from '../store';

export interface AdvancedStakeRewardsById {
    [id: string]: AdvancedStakeRewards;
}

export interface AdvancedStakeRewardsByHashedAddressAndById {
    [addressHex: string]: AdvancedStakeRewardsById;
}
interface AdvancedStakesRewardsState {
    value: AdvancedStakeRewardsByHashedAddressAndById;
    status: 'idle' | 'loading' | 'failed';
}

const initialState: AdvancedStakesRewardsState = {
    value: {},
    status: 'idle',
};

function shortAddressHash(address: string): string {
    // keyWidth is an arbitrary number just to ensure no collisions of hexed
    // addresses for one user
    const keyWidth = 10;
    return poseidon([address]).toString(16).slice(-keyWidth);
}

export const getAdvancedStakesRewards = createAsyncThunk(
    'advancedStakesRewards',
    async (
        context: Web3ReactContextInterface<Web3Provider>,
        {getState},
    ): Promise<[string, AdvancedStakeRewardsById] | undefined> => {
        const {account} = context;
        if (!account) return;

        let rewards;
        try {
            rewards = await getAdvancedStakingReward(account);
        } catch (error) {
            console.error(error);
            return;
        }

        if (!rewards) return;
        if (!rewards.staker) return;

        const state = getState() as RootState;
        const currentAdvancedRewards =
            advancedStakesRewardsSelector(account)(state);
        const rewardsFetchedFromSubgraph: AdvancedStakeRewardsById = {};

        rewards.staker.advancedStakingRewards.forEach(
            (r: AdvancedStakeRewardsResponse) => {
                rewardsFetchedFromSubgraph[r.id] = {
                    id: r.id,
                    creationTime: r.creationTime.toString(),
                    commitments: r.commitments,
                    utxoData: r.utxoData,
                    utxoStatus: UTXOStatus.UNDEFINED,
                    zZKP: r.zZkpAmount,
                    PRP: r.prpAmount,
                };
            },
        );

        // merging the state in a such way that if previous rewards existed,
        // they will not be overwritten by the new rewards fetched from the
        // subgraph.
        return [
            // hash of the account address to increase privacy as we store
            // advanced rewards in the local storage
            shortAddressHash(account),
            {
                ...(rewardsFetchedFromSubgraph as AdvancedStakeRewardsById),
                ...(currentAdvancedRewards as AdvancedStakeRewardsById),
            },
        ];
    },
);

export const refreshUTXOsStatuses = createAsyncThunk(
    'refreshUTXOsStatuses',
    async (
        context: Web3ReactContextInterface<Web3Provider>,
        {getState},
    ): Promise<[string, UTXOStatusByID[]] | undefined> => {
        const {library, account, chainId} = context;
        if (!library || !chainId || !account) {
            return;
        }

        const state: RootState = getState() as RootState;
        const advancedRewards = advancedStakesRewardsSelector(account)(state);

        return [
            account,
            await getChangedUTXOsStatuses(
                library,
                account,
                chainId,
                Object.values(advancedRewards),
            ),
        ];
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
        updateUTXOStatus: (state, action) => {
            const [address, id, status] = action.payload;
            const addrHash = shortAddressHash(address);
            const reward = state.value?.[addrHash]?.[id];
            if (reward) {
                reward.utxoStatus = status;
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
                if (action.payload) {
                    const [addressHex, rewards] = action.payload;
                    state.value[addressHex] = rewards;
                }
            })
            .addCase(getAdvancedStakesRewards.rejected, state => {
                state.status = 'failed';
            })
            .addCase(refreshUTXOsStatuses.pending, state => {
                state.status = 'loading';
            })
            .addCase(refreshUTXOsStatuses.fulfilled, (state, action) => {
                state.status = 'idle';
                if (action.payload) {
                    const [address, statusesByID] = action.payload;
                    const addrHash = shortAddressHash(address);
                    for (const [id, status] of statusesByID) {
                        const reward = state.value?.[addrHash]?.[id];
                        if (reward) {
                            console.debug(
                                `Updating UTXO status ID ${id}: ${reward.utxoStatus} -> ${status}`,
                            );
                            reward.utxoStatus = status;
                        }
                    }
                }
            })
            .addCase(refreshUTXOsStatuses.rejected, state => {
                state.status = 'failed';
            });
    },
});

export const advancedStakesRewardsSelector = (
    address: string | null | undefined,
): ((state: RootState) => AdvancedStakeRewardsById) => {
    return (state: RootState): AdvancedStakeRewardsById => {
        if (!address) return {};

        const rewardsByAddressAndId = (
            state.advancedStakesRewards as AdvancedStakesRewardsState
        ).value as AdvancedStakeRewardsByHashedAddressAndById;

        const addrHash = shortAddressHash(address);
        return rewardsByAddressAndId?.[addrHash] ?? {};
    };
};

export function totalSelector(
    address: string | null | undefined,
    tid: AdvancedStakeTokenIDs,
): (state: RootState) => BigNumber {
    return (state: RootState): BigNumber => {
        if (!address) return constants.Zero;

        const rewards = advancedStakesRewardsSelector(address)(state);
        if (!rewards) return constants.Zero;

        return Object.values(rewards)
            .filter((rewards: AdvancedStakeRewards) =>
                [UTXOStatus.UNDEFINED, UTXOStatus.UNSPENT].includes(
                    rewards.utxoStatus,
                ),
            )
            .map((reward: AdvancedStakeRewards) => {
                return reward[tid];
            })
            .reduce((acc: BigNumber, v) => acc.add(v), constants.Zero);
    };
}

export const {resetAdvancedStakesRewards, updateUTXOStatus} =
    advancedStakesRewardsSlice.actions;

export default advancedStakesRewardsSlice.reducer;
