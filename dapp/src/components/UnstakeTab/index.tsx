import * as React from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';

import UnstakeTable from '../UnstakeTable';

import TotalUnclaimedRewards from './TotalUnclaimedRewards';
import UnstakingInfoMSG from './UnstakingInfoMSG';

import './styles.scss';

export default function UnstakingTab() {
    return (
        <Box className="unstaking-tab-holder">
            <Card variant="outlined">
                <UnstakingInfoMSG />
                <UnstakeTable />
                <TotalUnclaimedRewards />
            </Card>
        </Box>
    );
}
