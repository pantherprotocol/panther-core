// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {toBN} from 'constants/numbers';

import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {Web3ReactContextInterface} from '@web3-react/core/dist/types';
import {BigNumber, constants} from 'ethers';
import {formatTime} from 'lib/format';
import {useAppSelector} from 'redux/hooks';
import {createExtraReducers, LoadingStatus} from 'redux/slices/shared';
import {RootState} from 'redux/store';
import {getStakesAndRewards, StakeRow} from 'services/staking';
import {AdvancedStakeTokenIDs} from 'staking';

interface StakeRowSerialized extends Omit<StakeRow, 'amount' | 'reward'> {
    amount: string;
    reward: string | {[key in AdvancedStakeTokenIDs]: string};
}

interface Stakes {
    value: StakeRowSerialized[];
    status: LoadingStatus;
}

const initialState: Stakes = {
    value: [],
    status: 'idle',
};

function serializeStake(stake: StakeRow): StakeRowSerialized {
    return {
        ...stake,
        amount: stake.amount.toString(),
        reward:
            stake.reward instanceof BigNumber
                ? stake.reward.toString()
                : {
                      PRP: stake.reward['PRP'].toString(),
                      zZKP: stake.reward['zZKP'].toString(),
                  },
    };
}

function deserializeStake(stake: StakeRowSerialized): StakeRow {
    return {
        ...stake,
        amount: toBN(stake.amount),
        reward:
            typeof stake.reward === 'string'
                ? toBN(stake.reward)
                : {
                      PRP: toBN(stake.reward['PRP']),
                      zZKP: toBN(stake.reward['zZKP']),
                  },
    };
}

export const getStakes = createAsyncThunk(
    'staking/stakes',
    async (
        context: Web3ReactContextInterface<any>,
    ): Promise<StakeRowSerialized[]> => {
        const {library, account, chainId} = context;
        if (!library || !chainId || !account) {
            return [];
        }

        const [totalStaked, stakeRows] = await getStakesAndRewards(
            library,
            chainId,
            account,
        ).catch(err => {
            console.error(err);
            return [BigNumber.from(0), []] as [BigNumber, StakeRow[]];
        });

        if (!stakeRows) {
            return [];
        }

        if (totalStaked.gt(constants.Zero)) {
            const block = await library.getBlock();
            console.debug(
                'Current block',
                block.number,
                'is at',
                block.timestamp,
                formatTime(block.timestamp * 1000),
            );

            stakeRows.forEach(row => {
                row.unstakable = block.timestamp > row.lockedTill;
            });
        }

        return stakeRows.map(serializeStake);
    },
);

export const stakesSlice = createSlice({
    name: 'staking/stakes',
    initialState,
    reducers: {},
    extraReducers: builder => {
        createExtraReducers({
            builder,
            asyncThunk: getStakes,
        });
    },
});

export const stakesSelector: (state: RootState) => Stakes = state =>
    state.staking.stakes;

export const useStakes: () => {
    status: LoadingStatus;
    stakes: StakeRow[];
} = () => {
    const {value: stakes, status} = useAppSelector(stakesSelector);
    return {status, stakes: stakes.map(deserializeStake)};
};

export default stakesSlice.reducer;
