import React from 'react';

import {Box, Typography} from '@mui/material';

import {formatLongTime} from '../../lib/format';

type Featuretype = {
    title: string;
    message: string;
};

const T_START = Number(process.env.ADVANCED_STAKING_T_START) * 1000;
const T_END = Number(process.env.ADVANCED_STAKING_T_END) * 1000;
const T_UNLOCK = Number(process.env.ADVANCED_STAKING_T_UNLOCK) * 1000;

const beginingAtDate = formatLongTime(T_START);
const allowedTillDate = formatLongTime(T_END);
const unstakingAvailableSince = formatLongTime(T_UNLOCK);

export const featuredata: Featuretype[] = [
    {
        title: 'Advanced Staking is available from:',
        message: beginingAtDate ?? '-',
    },
    {
        title: 'Advanced Staking is available till:',
        message: allowedTillDate ?? '-',
    },
    {
        title: 'Unstaking of principal and rewards redeeming are available from: ',
        message: unstakingAvailableSince ?? '-',
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
