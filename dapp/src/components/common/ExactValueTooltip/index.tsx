// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React, {ReactElement} from 'react';

import {Tooltip} from '@mui/material';
import {BigNumber} from 'ethers';
import {formatCurrency} from 'lib/format';

export function exactValueTooltip(value: BigNumber | null | undefined): string {
    return value
        ? `Exact value is ${formatCurrency(value, {decimals: 18})} `
        : '';
}

const ExactValueTooltip = (props: {
    balance?: BigNumber | null;
    children: ReactElement;
}) => {
    return (
        <Tooltip title={exactValueTooltip(props.balance)} placement="top">
            <div>{props.children}</div>
        </Tooltip>
    );
};

export default ExactValueTooltip;
