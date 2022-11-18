import React from 'react';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';

import NavigationMenu from './NavigationMenu';
import WalletHeader from './WalletHeader';

import './styles.scss';

const Header = () => {
    return (
        <Box sx={{flexGrow: 1}}>
            <AppBar position="static" className="app-bar">
                <Toolbar className="main-toolbar">
                    <Box className="header-content-wrapper">
                        <NavigationMenu />
                        <WalletHeader />
                    </Box>
                </Toolbar>
            </AppBar>
        </Box>
    );
};

export default Header;
