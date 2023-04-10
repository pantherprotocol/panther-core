// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React, {useState} from 'react';

import {getHeaderLinks, MenuLink, Routes} from 'constants/routes';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuIcon from '@mui/icons-material/Menu';
import Box from '@mui/material/Box';
import {useWeb3React} from '@web3-react/core';
import {classnames} from 'components/common/classnames';
import logo from 'images/panther-logo.svg';
import {Link} from 'react-router-dom';
import {isTestNetwork} from 'services/connectors';

import NavigationLink from './NavigationLink';

import './styles.scss';

export default function NavigationMenu() {
    const {active, chainId} = useWeb3React();
    const [openMenu, setOpenMenu] = useState(false);
    const links = getHeaderLinks({
        includeFaucet: !!chainId && isTestNetwork(chainId),
    });

    return (
        <Box className="nav-bar">
            <Box className="logo">
                <Link to={Routes.Staking}>
                    <img src={logo} alt="Logo" />
                </Link>
            </Box>
            <Box
                className={classnames({
                    'burger-menu': active,
                    disconnected: !active,
                })}
                onClick={() => setOpenMenu(!openMenu)}
            >
                <span>Menu</span>
                {openMenu ? (
                    <KeyboardArrowDownIcon className="menu-icon" />
                ) : (
                    <MenuIcon className="menu-icon" />
                )}
            </Box>
            <Box
                className={classnames({
                    expanded: openMenu,
                    'navigation-link_container': active,
                    'hidden-nav-links': !active,
                })}
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
