import {Web3Provider} from '@ethersproject/providers';
import {sumBigNumbers} from '@panther-core/crypto/lib/numbers';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {Web3ReactContextInterface} from '@web3-react/core/dist/types';
import {poseidon} from 'circomlibjs';
import {BigNumber, constants} from 'ethers';

import {IKeypair} from '../../lib/types';
import {getChangedUTXOsStatuses, UTXOStatusByID} from '../../services/pool';
import {getAdvancedStakingReward} from '../../services/staking';
import {AdvancedStakeRewardsResponse} from '../../services/subgraph';
import {
    AdvancedStakeRewards,
    AdvancedStakeTokenIDs,
    UTXOStatus,
} from '../../types/staking';
import {RootState} from '../store';

interface AdvancedStakeRewardsById {
    [leafId: string]: AdvancedStakeRewards;
}

// map of chainId -> addressHash -> leafId -> AdvancedStakeRewards
interface AdvancedStakeRewardsByChainId {
    [chainId: number]: AdvancedStakeRewardsByShortAddress;
}
interface AdvancedStakeRewardsByShortAddress {
    [addressHex: string]: AdvancedStakeRewardsById;
}

type LoadingStatus = 'idle' | 'loading' | 'failed';

interface AdvancedStakesRewardsState {
    value: AdvancedStakeRewardsByChainId;
    lastRefreshTime: number | null;
    status: LoadingStatus;
}

const initialState: AdvancedStakesRewardsState = {
    value: {},
    lastRefreshTime: null,
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
    ): Promise<[number, string, AdvancedStakeRewardsById] | undefined> => {
        const {account, chainId} = context;
        if (!account) return;
        if (!chainId) return;

        const rewards = await getAdvancedStakingReward(chainId, account);
        if (rewards instanceof Error) {
            console.error(
                `Cannot fetch the rewards from the subgraph. ${rewards}`,
            );
            return;
        }

        if (!rewards) return;
        if (!rewards.staker) return;

        const state = getState() as RootState;
        const currentAdvancedRewards = advancedStakesRewardsSelector(
            chainId,
            account,
        )(state);
        const rewardsFetchedFromSubgraph: AdvancedStakeRewardsById = {};

        rewards.staker.advancedStakingRewards.forEach(
            (r: AdvancedStakeRewardsResponse) => {
                rewardsFetchedFromSubgraph[r.id] = {
                    id: r.id,
                    creationTime: r.creationTime.toString(),
                    commitments: r.commitments,
                    utxoData: r.utxoData,
                    zZkpUTXOStatus: UTXOStatus.UNDEFINED,
                    zZKP: r.zZkpAmount,
                    PRP: r.prpAmount,
                };
            },
        );
        // merging the state in a such way that if previous rewards existed,
        // they will not be overwritten by the new rewards fetched from the
        // subgraph.
        return [
            chainId,
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
        payload: {
            context: Web3ReactContextInterface<Web3Provider>;
            keys: IKeypair[];
        },
        {getState},
    ): Promise<[number, string, UTXOStatusByID[]] | undefined> => {
        const {context, keys} = payload;
        const {library, account, chainId} = context;
        if (!library || !chainId || !account) {
            return;
        }
        const state: RootState = getState() as RootState;
        const advancedRewards = advancedStakesRewardsSelector(
            chainId,
            account,
        )(state);

        const statusesNeedUpdate = await getChangedUTXOsStatuses(
            library,
            account,
            chainId,
            Object.values(advancedRewards),
            keys,
        );

        return [chainId, account, statusesNeedUpdate];
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
            const [chainId, address, id, status] = action.payload;
            const addrHash = shortAddressHash(address);
            const reward = state.value?.[chainId]?.[addrHash]?.[id];
            if (reward) {
                reward.zZkpUTXOStatus = status;
            }
        },
        updateLastRefreshTime: state => {
            // updating the lastRefreshTime to the current time only in
            // case if the previous value of lastRefreshTime is
            // undefined or less than the current time to prevent race
            // conditions during multiple refreshes
            const now = +Date.now();
            if (state.lastRefreshTime === null || state.lastRefreshTime < now) {
                state.lastRefreshTime = now;
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
                    const [chainId, shortAddressHash, rewards] = action.payload;
                    state.value[chainId] = state.value[chainId] || {};
                    state.value[chainId][shortAddressHash] = rewards;
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
                    const [chainId, address, statusesByID] = action.payload;
                    const addrHash = shortAddressHash(address);
                    for (const [id, status] of statusesByID) {
                        const reward = state.value?.[chainId]?.[addrHash]?.[id];
                        if (reward) {
                            console.debug(
                                `Updating UTXO status ID ${id}: ${reward.zZkpUTXOStatus} -> ${status}`,
                            );
                            reward.zZkpUTXOStatus = status;
                        }
                    }
                }
                advancedStakesRewardsSlice.caseReducers.updateLastRefreshTime(
                    state,
                );
            })
            .addCase(refreshUTXOsStatuses.rejected, state => {
                state.status = 'failed';
            });
    },
});

export const advancedStakesRewardsSelector = (
    chainId: number | null | undefined,
    address: string | null | undefined,
): ((state: RootState) => AdvancedStakeRewardsById) => {
    return (state: RootState): AdvancedStakeRewardsById => {
        if (!address) return {};
        if (!chainId) return {};

        const rewardsByAddressAndId = (
            state.advancedStakesRewards as AdvancedStakesRewardsState
        ).value as AdvancedStakeRewardsByChainId;

        const addrHash = shortAddressHash(address);
        return rewardsByAddressAndId?.[chainId]?.[addrHash] ?? {};
    };
};

export function totalSelector(
    chainId: number | null | undefined,
    address: string | null | undefined,
    tid: AdvancedStakeTokenIDs,
    includeIfZZkpSpent = false,
): (state: RootState) => BigNumber {
    return (state: RootState): BigNumber => {
        if (!address) return constants.Zero;

        const rewards = advancedStakesRewardsSelector(chainId, address)(state);
        if (!rewards) return constants.Zero;

        const rewardItems = Object.values(rewards)
            // filter of spent statuses always ignores UNDEFINED Status
            .filter((rewards: AdvancedStakeRewards) => {
                if (includeIfZZkpSpent) {
                    return [UTXOStatus.SPENT, UTXOStatus.UNSPENT].includes(
                        rewards.zZkpUTXOStatus,
                    );
                } else {
                    return UTXOStatus.UNSPENT === rewards.zZkpUTXOStatus;
                }
            })
            .map((reward: AdvancedStakeRewards) => {
                return reward[tid];
            });
        return sumBigNumbers(rewardItems);
    };
}

export function hasUndefinedUTXOsSelector(
    chainId: number | null | undefined,
    address: string | null | undefined,
): (state: RootState) => boolean {
    return (state: RootState): boolean => {
        // If there is no address or chainId for any reason, then we can't find
        // any
        if (!address) return false;
        if (!chainId) return false;

        const rewards = advancedStakesRewardsSelector(chainId, address)(state);
        // if there are no rewards yet for this address for any reason, then  it
        // is up to date too
        if (Object.keys(rewards).length === 0) return false;

        const rewardsWithUndefinedStatus = Object.values(rewards).find(
            (r: AdvancedStakeRewards) => {
                return r.zZkpUTXOStatus === UTXOStatus.UNDEFINED;
            },
        );

        return !!rewardsWithUndefinedStatus;
    };
}

export function lastRefreshTime(state: RootState): number | null {
    return state.advancedStakesRewards.lastRefreshTime;
}

export function statusSelector(state: RootState): LoadingStatus {
    return state.advancedStakesRewards.status;
}

export const {resetAdvancedStakesRewards, updateUTXOStatus} =
    advancedStakesRewardsSlice.actions;

export default advancedStakesRewardsSlice.reducer;
