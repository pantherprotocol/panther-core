import React from 'react';

import {Box, LinearProgress, Typography} from '@mui/material';

import './styles.scss';

interface ClaimedProgressTypes {
    claimed: number;
    total: number;
}

function formatNumber(v: number): string {
    if (v >= 1e6) {
        return (v / 1e6).toFixed(0) + 'm';
    }
    if (v >= 1e3) {
        return (v / 1e3).toFixed(0) + 'k';
    }

    return v.toFixed(0);
}

export default function ClaimedProgress(props: ClaimedProgressTypes) {
    const claimed = props?.claimed;
    const total = props?.total;
    const percentage = (claimed / total) * 100;

    const formattedClaimed = formatNumber(claimed);
    const formattedTotal = formatNumber(total);
    const formattedPercentage = !Number.isNaN(percentage)
        ? formatNumber(percentage)
        : '0';

    return (
        <Box className="claimed-progress-container">
            <Box className="claimed-progress">
                <Typography className="title">
                    Advanced Staking Rewards
                </Typography>
                <Box className="progress-holder">
                    <LinearProgress
                        className="progress"
                        variant="determinate"
                        value={percentage}
                    />
                </Box>
                <Typography className="claimed-value">
                    {`${formattedClaimed} / ${formattedTotal} claimed (${formattedPercentage}%)`}
                </Typography>
            </Box>
        </Box>
    );
}
