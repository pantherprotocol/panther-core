import React from 'react';

import {Grid} from '@mui/material';

import Links from './Links';
import Socials from './Socials';

import './styles.scss';

export const Footer = () => {
    return (
        <Grid container className="footer-holder">
            <Grid item xs={12} md={6} className="footer-socials">
                <Socials />
            </Grid>
            <Grid item xs={12} md={6} className="footer-links">
                <Links />
            </Grid>
        </Grid>
    );
};
