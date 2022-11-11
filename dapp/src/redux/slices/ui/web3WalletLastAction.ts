// eslint-disable-next-line import/named
import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {RootState} from 'redux/store';

export type WalletActionStatus =
    | 'in progress'
    | 'succeeded'
    | 'failed'
    | 'unknown'
    | 'none';

export type WalletSignatureTrigger =
    | 'undefined UTXOs'
    | 'manual refresh'
    | 'zZKP redemption'
    | 'register exit commitment'
    | 'unstake'
    | 'stake';

export type WalletActionName =
    | 'refreshUTXOsStatuses'
    | 'signMessage'
    | 'getAdvancedStakesRewards'
    | 'stake'
    | 'exit'
    | '';

// In the future, there may be other types of trigger
export type WalletActionTrigger = WalletSignatureTrigger;

export type Web3WalletActionCause = {
    caller: string;
    trigger: WalletActionTrigger;
};

export interface Web3WalletLastActionState {
    action: WalletActionName; // e.g. 'signMessage'
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
    name: WalletActionName;
    cause: Web3WalletActionCause;
    data: any;
};

function startAction(
    state: Web3WalletLastActionState,
    name: WalletActionName,
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
    name: 'ui/Web3WalletLastAction',
    initialState,
    reducers: {
        startAction: (
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
        registerActionSuccess: (
            state,
            action: PayloadAction<WalletActionName>,
        ) => {
            checkActionInProgress(state.action, action.payload, 'success');
            state.status = 'succeeded';
        },
        progressToNewAction: (
            state,
            action: PayloadAction<{
                oldAction: WalletActionName;
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
        registerActionFailure: (
            state,
            action: PayloadAction<WalletActionName>,
        ) => {
            checkActionInProgress(state.action, action.payload, 'failure');
            state.status = 'failed';
        },

        acknowledgeByUser: (state, action: PayloadAction<WalletActionName>) => {
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
    state.ui.Web3WalletLastAction.status;

export function showWalletActionInProgressSelector(
    action: WalletActionName,
): (state: RootState) => boolean {
    return (state: RootState) =>
        state.ui.Web3WalletLastAction.status == 'in progress' &&
        state.ui.Web3WalletLastAction.action == action &&
        !state.ui.Web3WalletLastAction.acknowledgedByUser;
}

export const walletActionCauseSelector = (state: RootState) =>
    state.ui.Web3WalletLastAction.cause;

export const {
    startAction: startWalletAction,
    registerActionSuccess: registerWalletActionSuccess,
    progressToNewAction: progressToNewWalletAction,
    registerActionFailure: registerWalletActionFailure,
    acknowledgeByUser,
} = Web3WalletLastActionSlice.actions;
export default Web3WalletLastActionSlice.reducer;

function checkActionInProgress(
    actionInProgress: WalletActionName,
    action: WalletActionName,
    registration: string,
): void {
    if (actionInProgress !== action) {
        throw new Error(
            `Tried to register ${registration} for ${action} but the action in progress was ${actionInProgress}`,
        );
    }
}
