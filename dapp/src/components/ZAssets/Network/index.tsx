import * as React from 'react';

import {Box, Typography} from '@mui/material';
import {useWeb3React} from '@web3-react/core';
import polygonIcon from 'images/polygon-beige-logo.svg';

import './styles.scss';

export default function Network(props: {networkName: string}) {
    const {active} = useWeb3React();

    return (
        <Box className="asset-network" data-testid="ZAssets_network_container">
            {active ? (
                <>
                    <Typography className="network-logo">
                        <img src={polygonIcon} />
                    </Typography>
                    <Typography className="asset-name">
                        {props.networkName}
                    </Typography>
                </>
            ) : (
                'Not Connected'
            )}
        </Box>
    );
}
