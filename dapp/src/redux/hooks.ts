// eslint-disable-next-line import/named
import {TypedUseSelectorHook, useDispatch, useSelector} from 'react-redux';
import {deserializeError} from 'serialize-error';

import {RootState, AppDispatch} from './store';

export const useAppDispatch = () => {
    const dispatch = useDispatch<AppDispatch>();

    const safeDispatch = async (thunk: any, ...args: any[]) => {
        try {
            await dispatch(thunk(...args)).unwrap();
        } catch (error) {
            console.error(
                `Error in '${thunk.typePrefix}'`,
                deserializeError(error),
            );
        }
    };

    return safeDispatch;
};

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
