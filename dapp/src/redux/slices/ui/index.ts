// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {combineReducers} from '@reduxjs/toolkit';
import {persistReducer} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import acknowledgedNotificationsReducer from './acknowledged-notifications';
import blurReducer from './blur';
import isWalletConnectedReducer from './is-wallet-connected';
import isWalletUpdatingReducer from './is-wallet-updating';
import Web3WalletLastActionReducer from './web3-wallet-last-action';

const uiPersistConfig = {
    key: 'ui',
    storage: storage,
    whitelist: ['isWalletConnected', 'acknowledgedNotifications'],
};

const reducer = combineReducers({
    isWalletUpdating: isWalletUpdatingReducer,
    blur: blurReducer,
    Web3WalletLastAction: Web3WalletLastActionReducer,
    isWalletConnected: isWalletConnectedReducer,
    acknowledgedNotifications: acknowledgedNotificationsReducer,
});

export const uiReducer = persistReducer(uiPersistConfig, reducer);
