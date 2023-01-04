// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {useEffect, useState} from 'react';

import type {ActionCreator} from '@reduxjs/toolkit';
import {openNotification} from 'components/common/notification';
import {useAppDispatch, useAppSelector} from 'redux/hooks';
import {LoadingStatus} from 'redux/slices/shared';
import {RootState} from 'redux/store';

export function useStatusError<T>(
    title: string,
    message: string,
    statusSelector: (state: RootState) => LoadingStatus,
    resetStatus: ActionCreator<T>,
) {
    const dispatch = useAppDispatch();
    const [isShown, setIsShown] = useState<boolean>(false);
    const status = useAppSelector(statusSelector);

    useEffect(() => {
        if (status === 'failed' && !isShown) {
            openNotification(title, message, 'danger', 60000);
            setIsShown(true);
        }

        return () => {
            if (isShown) {
                dispatch(resetStatus);
                setIsShown(false);
            }
        };
    }, [status, title, message, isShown, dispatch, resetStatus]);
}
