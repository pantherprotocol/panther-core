import {combineReducers} from '@reduxjs/toolkit';

import acknowledgedNotificationsReducer from './acknowledgedNotifications';
import blurReducer from './blur';
import isWalletConnectedReducer from './isWalletConnected';
import Web3WalletLastActionReducer from './web3WalletLastAction';

export const uiReducer = combineReducers({
    blur: blurReducer,
    Web3WalletLastAction: Web3WalletLastActionReducer,
    isWalletConnected: isWalletConnectedReducer,
    acknowledgedNotifications: acknowledgedNotificationsReducer,
});
