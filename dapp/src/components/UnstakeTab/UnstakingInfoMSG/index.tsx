import React from 'react';

import {Box, Typography} from '@mui/material';

import './styles.scss';

export default function UnstakingInfoMSG() {
    return (
        <Box className="unstaking-info-message">
            <Typography variant="caption">
                Stake transactions must be staking for 7+ day to be eligible to
                unstake. Rewards are claimed once a transaction is unstaked.
            </Typography>
        </Box>
    );
}
