// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React from 'react';

import {footerLinks, MenuLink} from 'constants/routes';

import {Box} from '@mui/system';
import NavigationLink from 'components/Header/NavigationMenu/NavigationLink';

import './styles.scss';

const FooterNav = () => {
    return (
        <Box className="footer-nav-links">
            {footerLinks.map((link: MenuLink) => (
                <NavigationLink key={link.name} to={link.url}>
                    {link.name}
                </NavigationLink>
            ))}
        </Box>
    );
};

export default FooterNav;
