import React from 'react';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Toolbar from '@mui/material/Toolbar';

import NavigationMenu from './NavigationMenu';
import WalletHeader from './WalletHeader';

import './styles.scss';

const Header = (props: {
    onConnect: () => void;
    networkLogo?: string;
    networkName?: string;
    networkSymbol?: string;
    disconnect: () => void;
    switchNetwork: (chainId: number) => void;
}) => {
    return (
        <Box sx={{flexGrow: 1}}>
            <AppBar position="static" className="app-bar">
                <Toolbar className="main-toolbar">
                    <Grid container>
                        <NavigationMenu />
                        <WalletHeader
                            onConnect={props.onConnect}
                            switchNetwork={props.switchNetwork}
                            disconnect={props.disconnect}
                            networkName={props.networkName}
                            networkSymbol={props.networkSymbol}
                            networkLogo={props.networkLogo}
                        />
                    </Grid>
                </Toolbar>
            </AppBar>
        </Box>
    );
};

export default Header;
