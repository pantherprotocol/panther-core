import React, {ReactElement} from 'react';

import {linkTextToTx} from './links';

import './styles.scss';

export function MessageWithTx(props: {
    message: string | null;
    txHash: string | null;
}): ReactElement {
    return (
        <div className="text-with-link">
            <span>
                {props.message} (
                {linkTextToTx('your transaction', props.txHash)})
            </span>
        </div>
    );
}
