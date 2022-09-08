import {DetailedError} from '../../types/error';

import {openNotification} from './notification';

export function notifyError(err: DetailedError): Error {
    const {message, details, triggerError} = err;
    console.error(
        `${message}: ${details}. 
         ${triggerError ? ` Error info: ${triggerError}` : ''}
        `,
    );
    openNotification(message, details, 'danger', 60000);
    return new Error(details);
}
