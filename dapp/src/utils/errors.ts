function capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Parses the error message from a transaction error
and returns a human readable error message. It is used to display
friendly error messages to the user. */
export function parseTxErrorMessage(error: any): string {
    console.debug('parsing transaction error:', error);

    if (error.error && error.error.message && error.reason) {
        return `${capitalizeFirstLetter(error.error.message)}. Reason: ${
            error.reason
        }.`;
    }

    if (error.error && error.error.message) {
        return capitalizeFirstLetter(error.error.message);
    }

    if (error.message) {
        return capitalizeFirstLetter(error.message);
    }

    return 'Failed to submit transaction.';
}
