// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

export type DetailedError = {
    errorLabel: string; // Readable error message for UI
    message: string;
    triggerError?: Error | RPCError;
};

// Full list of error codes
// https://github.com/MetaMask/eth-rpc-errors/blob/main/src/error-constants.ts
export enum MetaMaskErrorCode {
    InvalidInput = -32000,
    ResourceNotFound = -32001,
    ResourceUnavailable = -32002,
    TransactionRejected = -32003,
    MethodNotSupported = -32004,
    LimitExceeded = -32005,
    Parse = -32700,
    InvalidRequest = -32600,
    MethodNotFound = -32601,
    InvalidParams = -32602,
    Internal = -32603,
    UserRejection = 4001,
    Unauthorized = 4100,
    UnsupportedMethod = 4200,
    Disconnected = 4900,
    ChainDisconnected = 4901,
}

export const MetaMaskErrorCodeSet = new Set(
    Object.keys(MetaMaskErrorCode)
        .filter(entry => !isNaN(Number(entry)))
        .map(Number),
);

export type RPCError = {
    code: MetaMaskErrorCode;
    message: string;
};
