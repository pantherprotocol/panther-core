// eslint-disable-next-line import/named
import {createSlice, PayloadAction} from '@reduxjs/toolkit';

import {RootState} from '../store';

export type WalletActionStatus =
    | 'in progress'
    | 'succeeded'
    | 'failed'
    | 'unknown'
    | 'none';

export type WalletSignatureTrigger =
    | 'undefined UTXOs'
    | 'manual refresh'
    | 'zZKP redemption';

// In the future, there may be other types of trigger
export type WalletActionTrigger = WalletSignatureTrigger;

export type Web3WalletActionCause = {
    caller: string;
    trigger: WalletActionTrigger;
};

export interface Web3WalletLastActionState {
    action: string; // e.g. 'signMessage'
    cause: Web3WalletActionCause | null;
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
    cause: Web3WalletActionCause;
    data: any;
};

function startAction(
    state: Web3WalletLastActionState,
    name: string,
    cause: Web3WalletActionCause,
    data: any,
) {
    state.action = name;
    state.acknowledgedByUser = false;
    state.data = data;
    state.cause = cause;
    state.status = 'in progress';
    console.debug(`Started new web3 wallet action ${name}`, cause, data);
}

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
            startAction(
                state,
                action.payload.name,
                action.payload.cause,
                action.payload.data,
            );
        },
        registerWalletActionSuccess: (state, action: PayloadAction<string>) => {
            checkActionInProgress(state.action, action.payload, 'success');
            state.status = 'succeeded';
        },
        progressToNewWalletAction: (
            state,
            action: PayloadAction<{
                oldAction: string;
                newAction: StartWalletActionPayload;
            }>,
        ) => {
            checkActionInProgress(
                state.action,
                action.payload.oldAction,
                'switch',
            );
            startAction(
                state,
                action.payload.newAction.name,
                action.payload.newAction.cause,
                action.payload.newAction.data,
            );
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
    progressToNewWalletAction,
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
