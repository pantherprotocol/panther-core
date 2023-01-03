// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React, {useState} from 'react';

import {getHeaderLinks, MenuLink} from 'constants/routes';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuIcon from '@mui/icons-material/Menu';
import Box from '@mui/material/Box';
import {useWeb3React} from '@web3-react/core';
import {SafeLink} from 'components/common/links';
import logo from 'images/panther-logo.svg';
import {isTestNetwork} from 'services/connectors';

import NavigationLink from './NavigationLink';

import './styles.scss';

export default function NavigationMenu() {
    const {chainId} = useWeb3React();
    const [openMenu, setOpenMenu] = useState(false);
    const links = getHeaderLinks({
        includeFaucet: !!chainId && isTestNetwork(chainId),
    });

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
                {links.map((link: MenuLink) => (
                    <NavigationLink key={link.name} to={link.url}>
                        {link.name}
                    </NavigationLink>
                ))}
            </Box>
        </Box>
    );
}
