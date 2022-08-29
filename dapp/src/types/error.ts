export type DetailedError = {
    message: string;
    details: any;
    triggerError?: Error;
};

export function isDetailedError(
    possiblyDetailedErrror: any,
): possiblyDetailedErrror is DetailedError {
    return 'details' in possiblyDetailedErrror;
}
