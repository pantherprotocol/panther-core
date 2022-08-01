import React from 'react';

import {Box, Typography} from '@mui/material';

import {formatLongTime} from '../../lib/format';

type Featuretype = {
    title: string;
    message: string;
};

const T_START = Number(process.env.ADVANCED_STAKING_T_START) * 1000;
const T_END = Number(process.env.ADVANCED_STAKING_T_END) * 1000;
const ADVANCED_STAKING_T_REDEMPTION =
    Number(process.env.ADVANCED_STAKING_T_REDEMPTION) * 1000;

const beginningAtDate = formatLongTime(T_START);
const allowedTillDate = formatLongTime(T_END);
const redeemingAvailableSince = formatLongTime(ADVANCED_STAKING_T_REDEMPTION);

export const featuredata: Featuretype[] = [
    {
        title: 'Advanced Staking is available from:',
        message: beginningAtDate ?? '-',
    },
    {
        title: 'Advanced Staking is available till:',
        message: allowedTillDate ?? '-',
    },
    {
        title: 'Rewards redeeming is available from: ',
        message: redeemingAvailableSince ?? '-',
    },
];

function Feature(props: {feature: Featuretype}) {
    return (
        <Box className="welcome-feature">
            <Typography className="feature-title">
                {props.feature.title}
            </Typography>
            <Typography className="feature-message">
                {props.feature.message}
            </Typography>
        </Box>
    );
}

export default Feature;
