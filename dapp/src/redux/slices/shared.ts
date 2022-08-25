// eslint-disable-next-line
import {ActionReducerMapBuilder} from '@reduxjs/toolkit';

export type LoadingStatus = 'idle' | 'loading' | 'failed';

export interface BalanceState {
    value: string | null;
    status: LoadingStatus;
}
export const initialBalanceState: BalanceState = {
    value: null,
    status: 'idle',
};

export function createExtraReducers({
    builder,
    asyncThunk,
}: {
    builder: ActionReducerMapBuilder<any>;
    asyncThunk: any;
}): void {
    builder
        .addCase(asyncThunk.pending, state => {
            state.status = 'loading';
        })
        .addCase(asyncThunk.fulfilled, (state, action) => {
            state.status = 'idle';
            state.value = action.payload;
        })
        .addCase(asyncThunk.rejected, state => {
            state.status = 'failed';
            state.value = null;
        });
}
