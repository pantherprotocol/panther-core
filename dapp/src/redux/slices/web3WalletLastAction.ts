// eslint-disable-next-line import/named
import {createSlice, PayloadAction} from '@reduxjs/toolkit';

import {WalletActionStatus, WalletActionCause} from '../../types/staking';
import {RootState} from '../store';

export interface Web3WalletLastActionState {
    action: string; // e.g. 'signMessage'
    cause: WalletActionCause | null;
    acknowledgedByUser: boolean; // true if user has acknowledged a notification or modal dialog for this action
    data: any; // e.g. data provided to signMessage(), only useful for debugging
    status: WalletActionStatus;
}

const initialState: Web3WalletLastActionState = {
    action: '',
    cause: null,
    acknowledgedByUser: false,
    data: {},
    status: 'none',
};

export type StartWalletActionPayload = {
    name: string;
    cause: WalletActionCause;
    data: any;
};

export const Web3WalletLastActionSlice = createSlice({
    name: 'Web3WalletLastAction',
    initialState,
    reducers: {
        startWalletAction: (
            state,
            action: PayloadAction<StartWalletActionPayload>,
        ) => {
            if (state.status === 'in progress')
                throw new Error(
                    `Tried to start the action ${action.payload.name} while the action ${state.action} has state '${state.status}'`,
                );
            state.action = action.payload.name;
            state.acknowledgedByUser = false;
            state.data = action.payload.data;
            state.status = 'in progress';
        },
        registerWalletActionSuccess: (state, action: PayloadAction<string>) => {
            checkActionInProgress(state.action, action.payload, 'success');
            state.status = 'succeeded';
        },
        registerWalletActionFailure: (state, action: PayloadAction<string>) => {
            checkActionInProgress(state.action, action.payload, 'failure');
            state.status = 'failed';
        },

        acknowledgeByUser: (state, action: PayloadAction<string>) => {
            checkActionInProgress(
                state.action,
                action.payload,
                'acknowledgment by user',
            );
            state.acknowledgedByUser = true;
        },
    },
});

export const walletActionStatusSelector = (state: RootState) =>
    state.Web3WalletLastAction.status;

export const showWalletActionInProgressSelector = (state: RootState) =>
    state.Web3WalletLastAction.status == 'in progress' &&
    !state.Web3WalletLastAction.acknowledgedByUser;

export const walletActionCauseSelector = (state: RootState) =>
    state.Web3WalletLastAction.cause;

export const {
    startWalletAction,
    registerWalletActionSuccess,
    registerWalletActionFailure,
    acknowledgeByUser,
} = Web3WalletLastActionSlice.actions;
export default Web3WalletLastActionSlice.reducer;

function checkActionInProgress(
    actionInProgress: string,
    action: string,
    registration: string,
): void {
    if (actionInProgress !== action) {
        throw new Error(
            `Tried to register ${registration} for ${action} but the action in progress was ${actionInProgress}`,
        );
    }
}
