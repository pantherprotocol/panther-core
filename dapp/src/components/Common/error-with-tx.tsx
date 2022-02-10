import React, {ReactElement} from 'react';

import {linkTextToTx} from './links';

export function ErrorWithTx(props: {
    errorMessage: string | null;
    txHash: string | null;
}): ReactElement {
    return (
        <div>
            <div>{props.errorMessage}</div>
            {props.txHash && process.env.BLOCK_EXPLORER && (
                <span>
                    {'Check your transaction on Block Explorer '}
                    {linkTextToTx(props.txHash, props.txHash)}
                </span>
            )}
        </div>
    );
}
