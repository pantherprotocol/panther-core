// eslint-disable-next-line import/named
import {TypedUseSelectorHook, useDispatch, useSelector} from 'react-redux';
import {deserializeError} from 'serialize-error';

import {RootState, AppDispatch} from './store';

export const useAppDispatch = () => {
    const dispatch = useDispatch<AppDispatch>();

    const safeDispatch = async (actionCreatorOrThunk: any, ...args: any[]) => {
        try {
            const dispatched = dispatch(actionCreatorOrThunk(...args));
            if (dispatched.unwrap) {
                // This action is a thunk
                // https://redux-toolkit.js.org/api/createAsyncThunk#unwrapping-result-actions
                await dispatched.unwrap();
            } else {
                await dispatched;
            }
        } catch (error) {
            console.error(
                `Error in '${actionCreatorOrThunk.typePrefix}'`,
                deserializeError(error),
            );
        }
    };

    return safeDispatch;
};

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
