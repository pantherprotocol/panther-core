// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {Web3Provider} from '@ethersproject/providers';
import {IKeypair} from '@panther-core/crypto/lib/types/keypair';
import {sumBigNumbers} from '@panther-core/crypto/lib/utils/numbers';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {Web3ReactContextInterface} from '@web3-react/core/dist/types';
import {poseidon} from 'circomlibjs';
import {BigNumber, constants} from 'ethers';
import {sleep} from 'lib/time';
import {LoadingStatus} from 'redux/slices/shared';
import {setWalletUpdating} from 'redux/slices/ui/is-wallet-updating';
import {RootState} from 'redux/store';
import {chainHasPoolContract} from 'services/contracts';
import {getChangedUTXOsStatuses, UTXOStatusByID} from 'services/pool';
import {
    PRP_REWARD_PER_STAKE,
    NUMBER_OF_FIRST_STAKES_GET_PRP_REWARD,
    unrealizedPrpReward,
} from 'services/rewards';
import {
    AdvancedStakeRewardsResponse,
    getAdvancedStakingReward,
} from 'services/subgraph';
import {
    AdvancedStakeRewards,
    AdvancedStakeTokenIDs,
    UTXOStatus,
} from 'types/staking';

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000;
const EXP_BACKOFF_FACTOR = 2;

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
    'wallet/advancedStakesRewards/get',
    async (
        payload: {
            context: Web3ReactContextInterface<Web3Provider>;
            withRetry: boolean | undefined;
        },
        {getState},
    ): Promise<[number, string, AdvancedStakeRewardsById] | undefined> => {
        const {account, chainId} = payload.context;
        if (!account || !chainId) return;
        const state = getState() as RootState;

        const currentAdvancedRewards = advancedStakesRewardsSelector(
            chainId,
            account,
        )(state);

        let rewardsFetchedFromSubgraph;
        if (payload.withRetry) {
            rewardsFetchedFromSubgraph = await getRewardsFromGraphWithRetry(
                chainId,
                account,
                Object.keys(currentAdvancedRewards).length,
            );
        } else {
            rewardsFetchedFromSubgraph = await getRewardsFromGraph(
                chainId,
                account,
            );
        }

        if (rewardsFetchedFromSubgraph instanceof Error) {
            console.error(rewardsFetchedFromSubgraph);
            return;
        }

        return [
            chainId,
            // hash of the account address to increase privacy as we store
            // advanced rewards in the local storage
            shortAddressHash(account),
            // merging the state in a such way that if previous rewards existed,
            // they will not be overwritten by the new rewards fetched from the
            // subgraph.
            {
                ...(rewardsFetchedFromSubgraph as AdvancedStakeRewardsById),
                ...(currentAdvancedRewards as AdvancedStakeRewardsById),
            },
        ];
    },
);

export const getAdvancedStakesRewardsAndUpdateStatus = createAsyncThunk(
    'wallet/advancedStakesRewards/getAndUpdateStatus',
    async (
        payload: {
            context: Web3ReactContextInterface<Web3Provider>;
            keys: IKeypair[] | undefined;
            withRetry: boolean;
        },
        {dispatch},
    ) => {
        dispatch(setWalletUpdating(true));
        await dispatch(getAdvancedStakesRewards(payload));

        if (!payload.keys) {
            dispatch(setWalletUpdating(false));
            console.error(
                'Cannot refresh the advanced staking rewards. No keys provided',
            );
            return;
        }

        const chainId = payload.context.chainId;
        if (chainId && chainHasPoolContract(chainId)) {
            await dispatch(
                refreshUTXOsStatuses({
                    context: payload.context,
                    keys: payload.keys,
                }),
            );
        }

        dispatch(setWalletUpdating(false));
    },
);

async function getRewardsFromGraph(
    chainId: number,
    account: string,
): Promise<AdvancedStakeRewardsById | Error> {
    const rewards = await getAdvancedStakingReward(chainId, account);
    if (rewards instanceof Error) {
        return new Error(
            `Cannot fetch the rewards from the subgraph. ${rewards}`,
        );
    }

    if (!rewards)
        return new Error(
            'Cannot fetch the rewards from the subgraph. No rewards found',
        );
    if (!rewards.staker)
        return new Error(
            'Cannot fetch the rewards from the subgraph. No staker found',
        );

    const rewardsFetchedFromSubgraph: AdvancedStakeRewardsById = {};

    rewards.staker.advancedStakingRewards.forEach(
        (r: AdvancedStakeRewardsResponse) => {
            // TODO: this hardcoded value should be removed in v 1.0 Due to the
            // recent changes in the smart contract, the PRP UTXOs are not being
            // generated upon staking. This is a temporary solution to hardcode
            // the PRP rewards. Only first 2000 stakes will get 2000 PRP
            // rewards. The rest will get 0 PRP rewards. This will be removed
            // once the PRP UTXOs are generated upon deployment of the version
            // 1.0 of the protocol. Magic number 4 comes from the fact that
            // commitments generate 4 leaves in the tree. Therefore, to get the
            // sequential number of the stake, we need to divide the left leafId
            // by 4.
            const quadIndex = BigNumber.from(r.id).toNumber() / 4;
            const prpAmount =
                quadIndex < NUMBER_OF_FIRST_STAKES_GET_PRP_REWARD
                    ? PRP_REWARD_PER_STAKE
                    : '0';
            return (rewardsFetchedFromSubgraph[r.id] = {
                id: r.id,
                creationTime: r.creationTime.toString(),
                commitments: r.commitments,
                utxoData: r.utxoData,
                zZkpUTXOStatus: UTXOStatus.UNDEFINED,
                zZKP: r.zZkpAmount,
                PRP: prpAmount,
            });
        },
    );

    return rewardsFetchedFromSubgraph;
}

export const refreshUTXOsStatuses = createAsyncThunk(
    'wallet/advancedStakesRewards/refreshUTXOsStatuses',
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

        let statusesNeedUpdate;
        try {
            statusesNeedUpdate = await getChangedUTXOsStatuses(
                library,
                account,
                chainId,
                Object.values(advancedRewards),
                keys,
            );
        } catch (err) {
            throw new Error(
                `Failed to get changed UTXOs statuses: ${err} ${
                    err instanceof Error ? err.stack : ''
                }`,
            );
        }

        return [chainId, account, statusesNeedUpdate];
    },
);

// getRewardsFromGraphWithRetry is used to fetch new rewards from the subgraph
// when you are expecting them to be there. This function makes several retires
// to fetch the rewards until fetched rewards array size is longer than the
// current ones. MAX_RETRIES is the maximum number of retries and
// INITIAL_RETRY_DELAY is the initial delay between retries which increases
// exponentially with each retry.
async function getRewardsFromGraphWithRetry(
    chainId: number,
    address: string,
    currentRewardsLength: number,
    retry = 0,
    delay = INITIAL_RETRY_DELAY,
): Promise<AdvancedStakeRewardsById | Error> {
    if (retry > MAX_RETRIES) {
        return new Error(
            'Cannot fetch the rewards from the subgraph. Max retries reached',
        );
    }

    await sleep(delay);

    const rewardsFetchedFromSubgraph = await getRewardsFromGraph(
        chainId,
        address,
    );

    if (
        rewardsFetchedFromSubgraph instanceof Error ||
        Object.keys(rewardsFetchedFromSubgraph).length === currentRewardsLength
    ) {
        return await getRewardsFromGraphWithRetry(
            chainId,
            address,
            currentRewardsLength,
            retry + 1,
            delay * EXP_BACKOFF_FACTOR,
        );
    }

    return rewardsFetchedFromSubgraph as AdvancedStakeRewardsById;
}

export const advancedStakesRewardsSlice = createSlice({
    name: 'wallet/advancedStakesRewards',
    initialState,
    reducers: {
        reset: state => {
            state.value = initialState.value;
            state.status = initialState.status;
        },
        resetStatus: state => {
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
        updateExitCommitmentTime: (state, action) => {
            const [chainId, address, id, currentTimeStamp] = action.payload;
            const addrHash = shortAddressHash(address);
            const reward = state.value?.[chainId]?.[addrHash]?.[id];
            if (reward) {
                reward.exitCommitmentTime = currentTimeStamp;
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
            state.wallet.advancedStakesRewards as AdvancedStakesRewardsState
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

export function totalUnrealizedPrpSelector(
    chainId: number | null | undefined,
    address: string | null | undefined,
): (state: RootState) => BigNumber {
    return (state: RootState): BigNumber => {
        if (!address) return constants.Zero;

        const rewards = advancedStakesRewardsSelector(chainId, address)(state);
        if (!rewards) return constants.Zero;

        const rewardItems = Object.values(rewards)
            // filter of spent statuses always ignores UNDEFINED Status
            .filter((rewards: AdvancedStakeRewards) => {
                return UTXOStatus.UNSPENT === rewards.zZkpUTXOStatus;
            })
            .map((reward: AdvancedStakeRewards) => {
                return unrealizedPrpReward(
                    BigNumber.from(reward.zZKP),
                    Number(reward.creationTime) * 1000,
                );
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
    return state.wallet.advancedStakesRewards.lastRefreshTime;
}

export function statusSelector(state: RootState): LoadingStatus {
    return state.wallet.advancedStakesRewards.status;
}

export const {
    reset: resetAdvancedStakesRewards,
    resetStatus: resetAdvancedStakesRewardsStatus,
    updateUTXOStatus,
    updateExitCommitmentTime,
} = advancedStakesRewardsSlice.actions;

export default advancedStakesRewardsSlice.reducer;
