// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {createSlice} from '@reduxjs/toolkit';
import {RootState} from 'redux/store';
import {MultiError} from 'services/errors';

export interface acknowledgedNotificationsState {
    [key: string]: boolean;
}

const initialState: acknowledgedNotificationsState = {
    zAssetsPage: false,
    notFirstVisit: false,
};

export enum PageWithNotification {
    zAssetsPage = 'zAssetsPage',
    notFirstVisit = 'notFirstVisit',
}

export const acknowledgedNotificationsSlice = createSlice({
    name: 'ui/acknowledgedNotifications',
    initialState,
    reducers: {
        acknowledgeNotification: (state, action) => {
            if (!(action.payload in PageWithNotification)) {
                throw new MultiError('The notificationOwner is not valid!');
            }

            state[action.payload] = true;
        },
    },
});

export const {acknowledgeNotification} = acknowledgedNotificationsSlice.actions;

export function acknowledgedNotificationSelector(
    notificationOwner: string,
): (state: RootState) => boolean {
    return (state: RootState): boolean => {
        return state.ui.acknowledgedNotifications?.[notificationOwner];
    };
}

export default acknowledgedNotificationsSlice.reducer;
