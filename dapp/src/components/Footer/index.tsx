// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import React from 'react';

import {Box} from '@mui/material';

import logo from '../../images/panther-logo.svg';

import FooterNav from './FooterNav';
import Socials from './Socials';

import './styles.scss';

const Footer = () => {
    return (
        <Box className="footer-holder" data-testid="footer">
            <Box className="title">
                <img src={logo} />
                <span>Panther</span>
            </Box>
            <Box className="links-container">
                <FooterNav />
                <Box className="footer-socials">
                    <Socials />
                </Box>
            </Box>
        </Box>
    );
};

export default Footer;
