// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React, {useState} from 'react';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuIcon from '@mui/icons-material/Menu';
import Box from '@mui/material/Box';
import {useWeb3React} from '@web3-react/core';
import {SafeLink} from 'components/Common/links';
import logo from 'images/panther-logo.svg';
import {isTestNetwork} from 'services/connectors';
import {env} from 'services/env';

import NavigationLink from './NavigationLink';

import './styles.scss';

export type MenuLink = {
    name: string;
    url: string;
};

export default function NavigationMenu() {
    const {chainId} = useWeb3React();
    const [openMenu, setOpenMenu] = useState(false);

    const defaultModeLinks: MenuLink[] = [
        {name: 'Staking', url: '/'},
        {name: 'zAssets', url: '/zAssets'},
        {
            name: 'Governance',
            url: 'https://snapshot.org/#/pantherprotocol.eth',
        },
        {
            name: 'Docs',
            url: 'https://docs.pantherprotocol.io/home/',
        },
    ];

    if (chainId && isTestNetwork(chainId)) {
        defaultModeLinks.push({name: 'Faucet', url: '/faucet'});
    }

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
        <Box className="nav-bar">
            <Box className="logo">
                <SafeLink href="https://pantherprotocol.io/">
                    <img src={logo} alt="Logo" />
                </SafeLink>
            </Box>
            <Box className="burger-menu" onClick={() => setOpenMenu(!openMenu)}>
                <span>Menu</span>
                {openMenu ? (
                    <KeyboardArrowDownIcon className="menu-icon" />
                ) : (
                    <MenuIcon className="menu-icon" />
                )}
            </Box>
            <Box
                className={`navigation-link_container ${
                    openMenu && 'expanded'
                }`}
            >
                {links()}
            </Box>
        </Box>
    );
}
