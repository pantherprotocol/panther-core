import * as React from 'react';

import {Box} from '@mui/material';

import UnstakeTable from '../UnstakeTable';

import UnstakingInfo from './UnstakingInfo';

import './styles.scss';

export default function UnstakingTab() {
    return (
        <Box
            className="unstaking-tab-holder"
            data-testid="unstake-tab_unstaking-tab_container"
        >
            <UnstakingInfo />
            <UnstakeTable />
        </Box>
    );
}
