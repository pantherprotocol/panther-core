// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {Store} from 'react-notifications-component';

export const openNotification = (
    title: string,
    message: string | React.ReactNode | React.FunctionComponent,
    type: 'success' | 'danger' | 'info' | 'default' | 'warning' | undefined,
    duration?: number | undefined,
) => {
    return Store.addNotification({
        title,
        message,
        type,
        insert: 'top',
        container: 'top-center',
        dismiss: {
            duration: duration || 0,
            showIcon: true,
            click: false,
        },
        animationIn: ['animate__animated', 'animate__fadeIn'],
        animationOut: ['animate__animated', 'animate__fadeOut'],
    });
};

export const removeNotification = (id: string) => {
    Store.removeNotification(id);
};
