// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {Box} from '@mui/material';
import UnstakeTable from 'components/UnstakeTable';

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
