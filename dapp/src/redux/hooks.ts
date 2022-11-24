// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

// eslint-disable-next-line import/named
import {TypedUseSelectorHook, useDispatch, useSelector} from 'react-redux';
import {deserializeError} from 'serialize-error';

import {RootState, AppDispatch} from './store';

export const useAppDispatch = () => {
    const dispatch = useDispatch<AppDispatch>();

    const safeDispatch = async (actionCreatorOrThunk: any, ...args: any[]) => {
        const name =
            actionCreatorOrThunk.typePrefix ?? actionCreatorOrThunk.type;
        try {
            // console.debug(`dispatching to ${name}`);
            // if (name === 'blur/removeBlur') debugger;
            const dispatched = dispatch(actionCreatorOrThunk(...args));
            // console.debug(`dispatched to ${name}`);
            if (dispatched.unwrap) {
                // This action is a thunk
                // https://redux-toolkit.js.org/api/createAsyncThunk#unwrapping-result-actions
                await dispatched.unwrap();
            } else {
                await dispatched;
            }
        } catch (error) {
            console.error(`Error in '${name}'`, deserializeError(error));
        }
    };

    return safeDispatch;
};

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
