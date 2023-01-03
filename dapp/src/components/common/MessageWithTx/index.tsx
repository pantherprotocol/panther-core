// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React, {ReactElement} from 'react';

import {Typography} from '@mui/material';
import {linkTextToTx} from 'components/common/links';
import {formatAccountAddress} from 'lib/format';

import {MessageWithTxProps} from './MessageWithTxProps.interface';

import './styles.scss';

export function MessageWithTx(props: MessageWithTxProps): ReactElement {
    const shortenAddress = formatAccountAddress(props.txHash);
    return (
        <Typography className="text-with-link">
            {props.message}&nbsp;
            {props.txHash && 'View on Block Explorer  '}
            {props.txHash &&
                linkTextToTx(
                    props.chainId,
                    props.linkText ?? shortenAddress ?? 'your transaction',
                    props.txHash,
                )}
        </Typography>
    );
}
