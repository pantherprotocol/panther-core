import * as React from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';

import UnstakeTable from '../UnstakeTable';

import TotalUnclaimedRewards from './TotalUnclaimedRewards';
import UnstakingInfoMSG from './UnstakingInfoMSG';

import './styles.scss';

export default function UnstakingTab(props: {fetchData: () => Promise<void>}) {
    return (
        <Box className="unstaking-tab-holder">
            <Card variant="outlined">
                <UnstakingInfoMSG />
                <UnstakeTable fetchData={props.fetchData} />
                <TotalUnclaimedRewards />
            </Card>
        </Box>
    );
}
