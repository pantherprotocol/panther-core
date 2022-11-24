// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {Box, Typography} from '@mui/material';

import './styles.scss';

export default function Balance(props: {
    balance: string;
    balanceValue: string;
    name: string;
}) {
    return (
        <Box className="asset-balance" data-testid="zasset-balance">
            <Typography className="balance">
                {props.balance}
                <span data-testid="zasset-balance-name">{props.name}</span>
            </Typography>
            <Typography className="balance-value">
                <span data-testid="zasset-balance-value">
                    {props.balanceValue}
                </span>
            </Typography>
        </Box>
    );
}
