// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import {isObject} from 'lodash';

export type DetailedError = {
    message: string;
    details: string;
    triggerError?: Error;
};

export function isDetailedError(
    possiblyDetailedError: any,
): possiblyDetailedError is DetailedError {
    return (
        possiblyDetailedError &&
        isObject(possiblyDetailedError) &&
        'message' in possiblyDetailedError &&
        'details' in possiblyDetailedError
    );
}
