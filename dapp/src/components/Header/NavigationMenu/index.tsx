import React from 'react';

import {Web3Provider} from '@ethersproject/providers';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import {useWeb3React} from '@web3-react/core';
import {Link, useHistory} from 'react-router-dom';

import logo from '../../../images/panther-logo.svg';
import {chainHasAdvancedStaking} from '../../../services/contracts';
import {SafeLink} from '../../Common/links';

import './styles.scss';

export default function NavigationMenu() {
    const context = useWeb3React<Web3Provider>();
    const {chainId} = context;
    const history = useHistory();
    const {location} = history;
    const {pathname} = location;

    return (
        <Grid item lg={6} md={12} xs={12} className="nav-bar">
            <Box className="logo">
                <SafeLink href="https://pantherprotocol.io/">
                    <img src={logo} alt="Logo" />
                </SafeLink>
            </Box>
            <Box className={`nav-item ${pathname === '/' ? 'selected' : ''}`}>
                <Link to={'/'}>Staking</Link>
            </Box>
            <Box
                className={`nav-item ${
                    pathname === '/zAssets' ? 'selected' : ''
                }`}
            >
                <Link
                    to={
                        chainHasAdvancedStaking(chainId) || !chainId
                            ? '/zAssets'
                            : '/'
                    }
                >
                    zAssets
                </Link>
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
