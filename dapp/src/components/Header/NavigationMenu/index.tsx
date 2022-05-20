import React from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import logo from '../../../images/panther-logo.svg';
import {SafeLink} from '../../Common/links';

import './styles.scss';

export default function NavigationMenu() {
    return (
        <Grid item lg={6} md={12} xs={12} className="nav-bar">
            <Box className="logo">
                <SafeLink href="https://pantherprotocol.io/">
                    <img src={logo} alt="Logo" />
                </SafeLink>
            </Box>
            <Box className="nav-item active-item">
                <Typography>
                    <a href="/">Staking</a>
                </Typography>
            </Box>
            <Box className="nav-item">
                <Typography>
                    <SafeLink href="https://docs.pantherprotocol.io/panther-dao-and-zkp/the-zkp-token/staking">
                        Docs
                    </SafeLink>
                </Typography>
            </Box>
            <Box className="nav-item">
                <Typography>
                    <SafeLink href="https://snapshot.org/#/pantherprotocol.eth">
                        Governance
                    </SafeLink>
                </Typography>
            </Box>
        </Grid>
    );
}
