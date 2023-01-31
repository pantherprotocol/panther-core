// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {
    DetailedError,
    MetaMaskErrorCode,
    MetaMaskErrorCodeSet,
    RPCError,
} from 'types/error';
import {isObject} from 'types/object';

/**
 * Error wrapper around most common errors:
 * 1) Default `Error` class `{message, stack}`
 * 2) RPC and MetaMask errors : `{code, message, stack}`
 * 3) Promise rejection errors `{message, stack, ...}`
 * 4) `DetailedError` for display `{message, details, triggerError}`
 */
export class MultiError<T = any> extends Error {
    // message: string
    code?: MetaMaskErrorCode;
    triggerError: Error | MultiError | RPCError;
    errorLabel?: string; // For displaying

    constructor(err: T) {
        let code: MetaMaskErrorCode | undefined;
        let message: string | undefined;
        let triggerError: Error | RPCError | undefined;
        let errorLabel: string | undefined;

        if (typeof err === 'string') {
            message = err;
        } else if (MultiError.isDetailedError(err)) {
            errorLabel = err.errorLabel;
            message = err.message;
            triggerError = err.triggerError;
        } else if (MultiError.isRPCError(err)) {
            code = err.code;
            message = parseTxErrorMessage(err);
        } else if (err instanceof Error) {
            message = err.message;
            triggerError = err;
        } else if (err instanceof MultiError) {
            code = err.code;
            message = err.message;
            triggerError = err.triggerError;
            errorLabel = err.errorLabel;
        } else {
            throw new Error('Unsupported error type');
        }

        super(message);
        this.code = code;
        this.errorLabel = errorLabel;
        this.triggerError = triggerError ?? this;
    }

    get isUserRejectedError(): boolean {
        return this.code === MetaMaskErrorCode.UserRejection;
    }

    get isDetailedError(): boolean {
        return !!this.errorLabel;
    }

    get isRPCError(): boolean {
        return !!this.code && MetaMaskErrorCodeSet.has(this.code);
    }

    get isDefaultError(): boolean {
        return !this.isRPCError && !this.isDetailedError;
    }

    static isRPCError(err: any): err is RPCError | MultiError<RPCError> {
        if (err instanceof MultiError) return err.isRPCError;
        if (err instanceof Error) return false;
        return (
            typeof err.code !== 'undefined' &&
            typeof err.message !== 'undefined' &&
            MetaMaskErrorCodeSet.has(err.code)
        );
    }

    static isDetailedError(
        err: any,
    ): err is DetailedError | MultiError<DetailedError> {
        if (err instanceof MultiError) return err.isDetailedError;
        return err && isObject(err) && 'errorLabel' in err && 'message' in err;
    }

    public addErrorLabel(label: string): MultiError {
        this.errorLabel = label;
        return this;
    }
}

/** Parses the error message from a transaction error
and returns a human readable error message. It is used to display
friendly error messages to the user. */
export function parseTxErrorMessage(error: any): string {
    console.debug('parsing transaction error:', error);

    if (error.data?.message) {
        return error.data.message;
    }

    if (error.error?.message && error.reason) {
        return error.reason;
    }

    if (error.error && error.error.message) {
        return error.error.message;
    }

    if (error.message) {
        // example of RPC error formatting
        // error.message =  "[ethjs-query] while formatting
        // outputs from RPC '{\"value\":{\"code\":-32603,
        // \"data\":{\"code\":-32000,\"message\":
        // \"transaction underpriced\"}}}'"

        // look for the message key in the error message
        const message = error.message.match(/"message":"(.+?)"/);
        if (message?.[1]) {
            return message[1];
        }

        return error.message;
    }

    return 'Failed to submit transaction.';
}
