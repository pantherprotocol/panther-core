import * as React from 'react';

import {Box, Typography} from '@mui/material';

import polygonIcon from '../../../images/polygon-logo.svg';

import './styles.scss';

export default function Network(props: {networkName: string}) {
    return (
        <Box className="asset-network">
            <Typography className="network-logo">
                <img src={polygonIcon} />
            </Typography>
            <Typography className="asset-name">{props.networkName}</Typography>
        </Box>
    );
}
