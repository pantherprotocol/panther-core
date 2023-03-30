// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {Web3Provider} from '@ethersproject/providers';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {Web3ReactContextInterface} from '@web3-react/core/dist/types';
import {IStakingTypes} from 'contracts/Staking';
import {LoadingStatus} from 'loading';
import {createExtraReducers} from 'redux/slices/shared';
import {RootState} from 'redux/store';
import {getStakingTermsFromContract} from 'services/staking';
import {
    StakeTermsByChainIdAndType,
    StakeTermsByType,
    StakeType,
} from 'types/staking';

interface StakeTermsState {
    value: StakeTermsByChainIdAndType | null;
    status: LoadingStatus;
}

const initialState: StakeTermsState = {
    value: null,
    status: 'idle',
};

export const getStakeTerms = createAsyncThunk(
    'staking/terms',
    async (
        context: Web3ReactContextInterface<Web3Provider>,
    ): Promise<StakeTermsByChainIdAndType | null> => {
        const {library, chainId} = context;
        if (!library || !chainId) return null;

        const stakeTermsByChainIdAndType: StakeTermsByChainIdAndType = {};
        stakeTermsByChainIdAndType[chainId] = {};
        for await (const stakeType of [
            StakeType.Advanced,
            StakeType.Classic,
            StakeType.AdvancedTwo,
        ]) {
            const terms = await getStakingTermsFromContract(
                library,
                chainId,
                stakeType,
            );

            stakeTermsByChainIdAndType[chainId][stakeType] = {...terms};
        }

        return stakeTermsByChainIdAndType;
    },
);

export const stakeTermsSlice = createSlice({
    name: 'stakeTerms',
    initialState,
    reducers: {},
    extraReducers: builder => {
        createExtraReducers({builder, asyncThunk: getStakeTerms});
    },
});

function termsSelector(
    state: RootState,
    chainId: number,
    stakeType: StakeType,
): IStakingTypes.TermsStructOutput | null {
    return allTermsSelector(state, chainId)?.[stakeType] ?? null;
}

function isStakingPostClose(terms: IStakingTypes.TermsStructOutput): boolean {
    if (!terms.isEnabled) {
        return false;
    }
    if (terms.allowedTill == 0) {
        return false;
    }
    if (Date.now() / 1000 < terms.allowedTill) {
        return false;
    }
    return true;
}

function isStakingOpen(terms: IStakingTypes.TermsStructOutput): boolean {
    if (!terms.isEnabled) {
        return false;
    }
    if (terms.allowedSince > 0 && Date.now() / 1000 < terms.allowedSince) {
        return false;
    }
    if (terms.allowedTill > 0 && terms.allowedTill < Date.now() / 1000) {
        return false;
    }
    return true;
}

export function isStakingOpenSelector(
    chainId: number | undefined,
    stakeType: StakeType,
): (state: RootState) => boolean {
    return (state: RootState): boolean => {
        if (!chainId) return false;
        const t = termsSelector(state, chainId, stakeType);
        if (!t) return false;

        return isStakingOpen(t);
    };
}

export function isStakingPostCloseSelector(
    chainId: number | undefined,
    stakeType: StakeType,
): (state: RootState) => boolean {
    return (state: RootState): boolean => {
        if (!chainId) return false;
        const t = termsSelector(state, chainId, stakeType);
        if (!t) return false;

        return isStakingPostClose(t);
    };
}

export function allTermsSelector(
    state: RootState,
    chainId: number,
): StakeTermsByType | null {
    return state.staking.stakeTerms.value?.[chainId] ?? null;
}

export function termsPropertySelector(
    chainId: number | undefined,
    stakeType: StakeType,
    property: keyof IStakingTypes.TermsStruct,
): (state: RootState) => IStakingTypes.TermsStruct[typeof property] | null {
    return (
        state: RootState,
    ): IStakingTypes.TermsStruct[typeof property] | null => {
        if (!chainId) return null;
        const t: IStakingTypes.TermsStructOutput | null = termsSelector(
            state,
            chainId,
            stakeType,
        );
        if (!t) return null;
        return t[property] ?? null;
    };
}

export function statusStakeTermsSelector(state: RootState): LoadingStatus {
    return state.staking.stakeTerms.status;
}

export default stakeTermsSlice.reducer;
