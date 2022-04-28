import React from 'react';

import {Box, Typography} from '@mui/material';

import './styles.scss';

export default function StakingInfo() {
    return (
        <Box className="staking-info-container">
            <Typography variant="subtitle2" className="staking-info-title">
                Staking will lock your tokens for a minimum of 7 days
            </Typography>
            <Typography className="staking-info-text">
                You will need to unstake to collect your rewards. Rewards are
                not automatically staked. Unstaking is available after 7 days.
            </Typography>
        </Box>
    );
}
