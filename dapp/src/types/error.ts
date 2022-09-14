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
        'message' in possiblyDetailedError &&
        'details' in possiblyDetailedError
    );
}
