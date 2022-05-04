import * as React from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';

import UnstakeTable from '../UnstakeTable';

import TotalUnclaimedRewards from './TotalUnclaimedRewards';
import UnstakingInfo from './UnstakingInfo';

import './styles.scss';

export default function UnstakingTab() {
    return (
        <Box className="unstaking-tab-holder">
            <Card variant="outlined">
                <UnstakingInfo />
                <UnstakeTable />
                <TotalUnclaimedRewards />
            </Card>
        </Box>
    );
}
