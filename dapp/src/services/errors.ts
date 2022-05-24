import {openNotification} from './notification';

export function notifyError(
    title: string,
    msg: string,
    diagnostics: any,
): Error {
    console.error(`${title}: ${msg}. Diagnostics info:`, diagnostics);
    openNotification(title, msg, 'danger', 60000);
    return new Error(msg);
}
