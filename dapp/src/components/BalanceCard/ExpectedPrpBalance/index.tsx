// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {IconButton, Tooltip} from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {expectedPrpBalanceTooltip} from 'components/common/tooltips';
import {BigNumber} from 'ethers';
import infoIcon from 'images/info-icon.svg';
import {formatCurrency} from 'lib/format';

import './styles.scss';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ExpectedPrpBalance = (props: {
    balance: BigNumber;
    redeem?: () => void;
}) => (
    <Box className="expected-prp-balance">
        <Box className="title-box">
            <Typography className="title">Expected PRP Balance:</Typography>
            <Tooltip
                className="tooltip-styling"
                title={
                    <span
                        className="tooltip-style"
                        dangerouslySetInnerHTML={{
                            __html: expectedPrpBalanceTooltip,
                        }}
                    />
                }
                placement="top"
            >
                <IconButton>
                    <img src={infoIcon} />
                </IconButton>
            </Tooltip>
        </Box>

        <Box className="balance-box">
            <Typography className="balance">
                {formatCurrency(props.balance, {decimals: 0, scale: 0})}
            </Typography>

            <Typography className="prp-symbol">PRP</Typography>
        </Box>
    </Box>
);

export default ExpectedPrpBalance;
