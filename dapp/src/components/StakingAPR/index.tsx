// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React from 'react';

import {Box, Typography} from '@mui/material';
import {formatPercentage} from 'lib/format';

import './styles.scss';

export default function StakingAPR(props: {advancedStakingAPY: number}) {
    return (
        <Box
            className="staking-apr"
            data-testid="advanced-staking-rewards_staking-apr_container"
        >
            <Typography className="text">Staking APR</Typography>
            <Typography
                className="value"
                data-testid="advanced-staking-rewards_staking-apr_value"
            >
                {formatPercentage(props.advancedStakingAPY / 100)}
            </Typography>
        </Box>
    );
}
