// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React from 'react';

import {Box} from '@mui/system';
import {MenuLink} from 'components/Header/NavigationMenu';
import NavigationLink from 'components/Header/NavigationMenu/NavigationLink';

import './styles.scss';

const links: MenuLink[] = [
    {name: 'Staking', url: '/'},
    {name: 'zAssets', url: '/zAssets'},
    {
        name: 'Governance',
        url: 'https://snapshot.org/#/pantherprotocol.eth',
    },
];

const FooterNav = () => {
    return (
        <Box className="footer-nav-links">
            {links.map(link => (
                <NavigationLink key={link.name} to={link.url}>
                    {link.name}
                </NavigationLink>
            ))}
        </Box>
    );
};

export default FooterNav;
