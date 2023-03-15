// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {combineReducers} from '@reduxjs/toolkit';
import {persistReducer} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import chainBalanceReducer from './chain-balance';
import poolV0Reducer from './poolV0';
import utxosReducer from './utxos';
import zkpTokenBalanceReducer from './zkp-token-balance';

const walletPersistConfig = {
    key: 'wallet',
    storage: storage,
    whitelist: ['utxos'],
};

const reducer = combineReducers({
    utxos: utxosReducer,
    chainBalance: chainBalanceReducer,
    poolV0: poolV0Reducer,
    zkpTokenBalance: zkpTokenBalanceReducer,
});

export const walletReducer = persistReducer(walletPersistConfig, reducer);
