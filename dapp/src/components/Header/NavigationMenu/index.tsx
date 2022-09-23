import React from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';

import logo from '../../../images/panther-logo.svg';
import {env} from '../../../services/env';
import {SafeLink} from '../../Common/links';

import NavigationLink from './NavigationLink';

import './styles.scss';

type MenuLink = {
    name: string;
    url: string;
};

export default function NavigationMenu() {
    const defaultModeLinks: MenuLink[] = [
        {name: 'Staking', url: '/'},
        {name: 'zAssets', url: '/zAssets'},
        {name: 'Faucet', url: '/faucet'},
        {
            name: 'Governance',
            url: 'https://snapshot.org/#/pantherprotocol.eth',
        },
    ];

    const faucetModeLinks: MenuLink[] = [
        {name: 'Staking', url: `${env.FAUCET_BASE_URL}`},
        {name: 'zAssets', url: `${env.FAUCET_BASE_URL}/zAssets`},
    ];

    function generateLinks(links: MenuLink[]): React.ReactElement[] {
        return links.map((link: MenuLink) => (
            <NavigationLink key={link.name} to={link.url}>
                {link.name}
            </NavigationLink>
        ));
    }

    function links(): React.ReactElement[] {
        switch (env.APP_MODE) {
            case 'faucet':
                return generateLinks(faucetModeLinks);
            default:
                return generateLinks(defaultModeLinks);
        }
    }

    return (
        <Grid item lg={6} md={12} xs={12} className="nav-bar">
            <Box className="logo">
                <SafeLink href="https://pantherprotocol.io/">
                    <img src={logo} alt="Logo" />
                </SafeLink>
            </Box>
            {...links()}
        </Grid>
    );
}
