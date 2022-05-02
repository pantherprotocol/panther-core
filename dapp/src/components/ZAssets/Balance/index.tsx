import * as React from 'react';

import {Box, Typography} from '@mui/material';

import './styles.scss';

export default function Balance(props?: {
    balance: string;
    balanceValue: string;
    name: string;
}) {
    return (
        <Box className="asset-balance">
            <Typography>
                {props?.balance}
                <span> {props?.name} </span>
            </Typography>
            <Typography>
                <span> {props?.balanceValue} </span>
            </Typography>
        </Box>
    );
}
