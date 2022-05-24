import {Web3Provider} from '@ethersproject/providers';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {Web3ReactContextInterface} from '@web3-react/core/dist/types';

import {getStakingTermsFromContract} from '../../services/staking';
import type {IStakingTypes} from '../../types/contracts/Staking';
import {StakeType, StakeTypes} from '../../types/staking';
import {RootState} from '../store';

type StakeTermsByType = {
    [key in StakeTypes]?: IStakingTypes.TermsStructOutput;
};

type StakeTermsByChainIdAndType = {
    [key in number]: StakeTermsByType;
};

type StakeTypeStatus = 'idle' | 'loading' | 'failed';

interface StakeTermsState {
    value: StakeTermsByChainIdAndType | null;
    status: StakeTypeStatus;
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
        for await (const stakeType of [StakeType.Advanced, StakeType.Classic]) {
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
        builder
            .addCase(getStakeTerms.pending, state => {
                state.status = 'loading';
            })
            .addCase(getStakeTerms.fulfilled, (state, action) => {
                state.status = 'idle';
                state.value = action.payload;
            })
            .addCase(getStakeTerms.rejected, state => {
                state.status = 'failed';
                state.value = null;
            });
    },
});

function terms(
    state: RootState,
    chainId: number,
    stakeType: StakeType,
): IStakingTypes.TermsStructOutput | null {
    return state.stakeTerms.value?.[chainId]?.[stakeType] ?? null;
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
        const t = terms(state, chainId, stakeType);
        if (!t) return false;

        return isStakingOpen(t);
    };
}

export function termsSelector(
    chainId: number | undefined,
    stakeType: StakeType,
    property: keyof IStakingTypes.TermsStruct,
): (state: RootState) => IStakingTypes.TermsStruct[typeof property] | null {
    return (
        state: RootState,
    ): IStakingTypes.TermsStruct[typeof property] | null => {
        if (!chainId) return null;
        const t: IStakingTypes.TermsStructOutput | null = terms(
            state,
            chainId,
            stakeType,
        );
        if (!t) return null;
        return t[property] ?? null;
    };
}

export function statusStakeTermsSelector(state: RootState): StakeTypeStatus {
    return state.stakeTerms.status;
}

export default stakeTermsSlice.reducer;
