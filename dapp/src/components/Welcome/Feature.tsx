import React from 'react';

import {Box, Typography} from '@mui/material';

import {formatTime} from '../../lib/format';

type Featuretype = {
    title: string;
    message: string;
};

const T_START = Number(process.env.ADVANCED_STAKING_T_START);
const T_END = Number(process.env.ADVANCED_STAKING_T_END);
const beginingAtDate = formatTime(Number(T_START), {
    style: 'long',
});
const allowedTillDate = formatTime(Number(T_END), {
    style: 'long',
});
const unstakingAvailableSince = formatTime(
    Number(Date.UTC(2022, 5, 17, 0, 0, 0)),
    {
        style: 'long',
    },
);
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
