export type DetailedError = {
    message: string;
    details: any;
    triggerError?: Error;
};

export function isDetailedError(
    possiblyDetailedError: any,
): possiblyDetailedError is DetailedError {
    return (
        'message' in possiblyDetailedError && 'details' in possiblyDetailedError
    );
}
