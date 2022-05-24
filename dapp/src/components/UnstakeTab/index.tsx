import * as React from 'react';

import {Box, Typography} from '@mui/material';
import {useWeb3React} from '@web3-react/core';

import UnstakeTable from '../UnstakeTable';

import TotalUnclaimedRewards from './TotalUnclaimedRewards';
import UnstakingInfo from './UnstakingInfo';

import './styles.scss';

export default function UnstakingTab() {
    const {active} = useWeb3React();

    if (!active) {
        return (
            <Box className="unstaking-tab-holder">
                <Typography variant="caption">
                    Please connect your wallet to a supported blockchain to
                    unstake.
                </Typography>
            </Box>
        );
    }

    return (
        <Box className="unstaking-tab-holder">
            <UnstakingInfo />
            <UnstakeTable />
            <TotalUnclaimedRewards />
        </Box>
    );
}
