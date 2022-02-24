import React, {ReactElement} from 'react';

import {useWeb3React} from '@web3-react/core';

import {linkTextToTx} from './links';

import './styles.scss';

export function MessageWithTx(props: {
    message: string | null;
    txHash: string | null;
}): ReactElement {
    const context = useWeb3React();

    const {chainId} = context;

    return (
        <div className="text-with-link">
            <span>
                {props.message} (
                {linkTextToTx(chainId, 'your transaction', props.txHash)})
            </span>
        </div>
    );
}
