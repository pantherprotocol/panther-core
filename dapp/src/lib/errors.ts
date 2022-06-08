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
