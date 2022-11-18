import {combineReducers} from '@reduxjs/toolkit';
import {persistReducer} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import acknowledgedNotificationsReducer from './acknowledgedNotifications';
import blurReducer from './blur';
import isWalletConnectedReducer from './isWalletConnected';
import Web3WalletLastActionReducer from './web3WalletLastAction';

const uiPersistConfig = {
    key: 'ui',
    storage: storage,
    whitelist: ['isWalletConnected', 'acknowledgedNotifications'],
};

const reducer = combineReducers({
    blur: blurReducer,
    Web3WalletLastAction: Web3WalletLastActionReducer,
    isWalletConnected: isWalletConnectedReducer,
    acknowledgedNotifications: acknowledgedNotificationsReducer,
});

export const uiReducer = persistReducer(uiPersistConfig, reducer);
