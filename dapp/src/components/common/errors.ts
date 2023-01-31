// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as Sentry from '@sentry/browser';
import {MultiError} from 'services/errors';
import {DetailedError} from 'types/error';

import {openNotification} from './notification';

export function notifyError(err: DetailedError | MultiError): MultiError {
    const errorLabel =
        err.errorLabel ?? 'Unexpected error occurred, please retry';
    const message = err.message;
    const triggerError = err.triggerError;

    console.error(
        `${errorLabel}: ${message}.
        ${triggerError ? ` Error info: ${triggerError.message}` : ''}
        `,
    );
    Sentry.captureException(err);
    openNotification(errorLabel, message, 'danger', 60000);
    return new MultiError(triggerError);
}
