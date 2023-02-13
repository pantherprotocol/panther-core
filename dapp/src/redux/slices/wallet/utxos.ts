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
import {LoadingStatus} from 'loading';
import {RootState} from 'redux/store';
import {chainHasPoolContract} from 'services/contracts';
import {MultiError} from 'services/errors';
import {getChangedUTXOsStatuses} from 'services/pool';
import {unrealizedPrpReward, prpReward} from 'services/rewards';
import {
    chainHasSubgraphAccounts,
    getAdvancedStakingReward,
} from 'services/subgraph';
import {AdvancedStakeRewardsResponse} from 'subgraph';
import {UTXO, UTXOStatus, UTXOStatusByID} from 'types/utxo';

import {setWalletUpdating} from '../ui/is-wallet-updating';

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000;
const EXP_BACKOFF_FACTOR = 2;

interface utxoById {
    [leafId: string]: UTXO;
}

// map of chainId -> addressHash -> leafId -> AdvancedStakeRewards
interface utxosByChainId {
    [chainId: number]: AdvancedStakeRewardsByShortAddress;
}
interface AdvancedStakeRewardsByShortAddress {
    [addressHex: string]: utxoById;
}

interface utxosState {
    value: utxosByChainId;
    lastRefreshTime: number | null;
    status: LoadingStatus;
}

const initialState: utxosState = {
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

export const getUTXOs = createAsyncThunk(
    'wallet/utxos/get',
    async (
        payload: {
            context: Web3ReactContextInterface<Web3Provider>;
            withRetry: boolean | undefined;
        },
        {getState},
    ): Promise<[number, string, utxoById] | undefined> => {
        const {account, chainId} = payload.context;
        if (!account || !chainId) return;

        const state = getState() as RootState;
        const currentUTXOs = utxosSelector(chainId, account)(state);

        let utxosFetchedFromSubgraph;
        if (payload.withRetry) {
            utxosFetchedFromSubgraph = await getRewardsFromGraphWithRetry(
                chainId,
                account,
                Object.keys(currentUTXOs).length,
            );
        } else {
            utxosFetchedFromSubgraph = await getRewardsFromGraph(
                chainId,
                account,
            );
        }

        if (utxosFetchedFromSubgraph instanceof MultiError) {
            console.error(utxosFetchedFromSubgraph);
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
                ...(utxosFetchedFromSubgraph as utxoById),
                ...(currentUTXOs as utxoById),
            },
        ];
    },
);

export const getUTXOsAndUpdateStatus = createAsyncThunk(
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
        await dispatch(getUTXOs(payload));

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
): Promise<utxoById | MultiError> {
    const rewards = await getAdvancedStakingReward(chainId, account);
    if (rewards instanceof MultiError) {
        return new MultiError(
            `Cannot fetch the rewards from the subgraph. ${rewards}`,
        );
    }

    if (!rewards)
        return new MultiError(
            'Cannot fetch the rewards from the subgraph. No rewards found',
        );
    if (!rewards.staker)
        return new MultiError(
            'Cannot fetch the rewards from the subgraph. No staker found',
        );

    const rewardsFetchedFromSubgraph: utxoById = {};

    rewards.staker.advancedStakingRewards.forEach(
        (r: AdvancedStakeRewardsResponse) => {
            return (rewardsFetchedFromSubgraph[r.id] = {
                id: r.id,
                creationTime: r.creationTime,
                commitment: r.commitments[0],
                data: r.utxoData,
                status: UTXOStatus.UNDEFINED,
                amount: r.zZkpAmount,
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
        const utxos = utxosSelector(chainId, account)(state);

        let statusesNeedUpdate;
        try {
            statusesNeedUpdate = await getChangedUTXOsStatuses(
                library,
                account,
                chainId,
                Object.values(utxos),
                keys,
            );
        } catch (err) {
            throw new MultiError(
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
): Promise<utxoById | MultiError> {
    if (!chainHasSubgraphAccounts(chainId))
        return new MultiError('Subgraph accounts are not yet defined');

    if (retry > MAX_RETRIES) {
        return new MultiError(
            'Cannot fetch the rewards from the subgraph. Max retries reached',
        );
    }

    await sleep(delay);

    const rewardsFetchedFromSubgraph = await getRewardsFromGraph(
        chainId,
        address,
    );

    if (
        rewardsFetchedFromSubgraph instanceof MultiError ||
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

    return rewardsFetchedFromSubgraph as utxoById;
}

export const utxosSlice = createSlice({
    name: 'wallet/utxos',
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
                reward.status = status;
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
            .addCase(getUTXOs.pending, state => {
                state.status = 'loading';
            })
            .addCase(getUTXOs.fulfilled, (state, action) => {
                state.status = 'idle';
                if (action.payload) {
                    const [chainId, shortAddressHash, rewards] = action.payload;
                    state.value[chainId] = state.value[chainId] || {};
                    state.value[chainId][shortAddressHash] = rewards;
                }
            })
            .addCase(getUTXOs.rejected, state => {
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
                                `Updating UTXO status ID ${id}: ${reward.status} -> ${status}`,
                            );
                            reward.status = status;
                        }
                    }
                }
                utxosSlice.caseReducers.updateLastRefreshTime(state);
            })
            .addCase(refreshUTXOsStatuses.rejected, state => {
                state.status = 'failed';
            });
    },
});

export const utxosSelector = (
    chainId: number | null | undefined,
    address: string | null | undefined,
): ((state: RootState) => utxoById) => {
    return (state: RootState): utxoById => {
        if (!address) return {};
        if (!chainId) return {};

        const rewardsByAddressAndId = (state.wallet.utxos as utxosState)
            .value as utxosByChainId;

        const addrHash = shortAddressHash(address);
        return rewardsByAddressAndId?.[chainId]?.[addrHash] ?? {};
    };
};

export function totalSelector(
    chainId: number | null | undefined,
    address: string | null | undefined,
): (state: RootState) => BigNumber {
    // this selector assumes that all UTXOs are of the same asset. In v.1.0, we
    // wound have to add a parameter to specify the asset
    return (state: RootState): BigNumber => {
        if (!address) return constants.Zero;

        const utxos = utxosSelector(chainId, address)(state);
        if (!utxos) return constants.Zero;

        const rewardItems = Object.values(utxos)
            // filter of spent statuses always ignores UNDEFINED Status
            .filter((utxo: UTXO) => {
                return UTXOStatus.UNSPENT === utxo.status;
            })
            .map((utxo: UTXO) => {
                return utxo.amount;
            });
        return sumBigNumbers(rewardItems);
    };
}

export function totalPRPSelector(
    chainId: number | null | undefined,
    address: string | null | undefined,
): (state: RootState) => BigNumber {
    return (state: RootState): BigNumber => {
        if (!address) return constants.Zero;

        const utxos = utxosSelector(chainId, address)(state);
        if (!utxos) return constants.Zero;

        const prpAmounts = Object.values(utxos)
            // filter of spent statuses always ignores UNDEFINED Status
            .filter((rewards: UTXO) => {
                return [UTXOStatus.SPENT, UTXOStatus.UNSPENT].includes(
                    rewards.status,
                );
            })
            .map((reward: UTXO) => {
                return prpReward(reward.creationTime * 1000);
            });
        return sumBigNumbers(prpAmounts);
    };
}

export function totalUnrealizedPrpSelector(
    chainId: number | null | undefined,
    address: string | null | undefined,
): (state: RootState) => BigNumber {
    return (state: RootState): BigNumber => {
        if (!address) return constants.Zero;

        const utxos = utxosSelector(chainId, address)(state);
        if (!utxos) return constants.Zero;

        const unrealizedPRPs = Object.values(utxos)
            // filter of spent statuses always ignores UNDEFINED Status
            .filter((rewards: UTXO) => {
                return UTXOStatus.UNSPENT === rewards.status;
            })
            .map((reward: UTXO) => {
                return unrealizedPrpReward(
                    BigNumber.from(reward.amount),
                    Number(reward.creationTime) * 1000,
                );
            });
        return sumBigNumbers(unrealizedPRPs);
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

        const utxos = utxosSelector(chainId, address)(state);
        // if there are no UTXOs yet for this address for any reason, then  it
        // is up to date too
        if (Object.keys(utxos).length === 0) return false;

        const utxosWithUndefinedStatus = Object.values(utxos).find(
            (r: UTXO) => {
                return r.status === UTXOStatus.UNDEFINED;
            },
        );

        return !!utxosWithUndefinedStatus;
    };
}

export function lastRefreshTime(state: RootState): number | null {
    return state.wallet.utxos.lastRefreshTime;
}

export function statusSelector(state: RootState): LoadingStatus {
    return state.wallet.utxos.status;
}

export const {
    reset: resetUTXOs,
    resetStatus: resetUTXOsStatus,
    updateUTXOStatus,
    updateExitCommitmentTime,
} = utxosSlice.actions;

export default utxosSlice.reducer;
