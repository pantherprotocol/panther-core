import * as React from 'react';

import {Box, Card} from '@mui/material';

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
