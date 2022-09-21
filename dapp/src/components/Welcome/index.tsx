import React from 'react';

import {Box, Grid, Typography} from '@mui/material';

import {useAppDispatch} from '../../redux/hooks';
import {registerFirstVisit} from '../../redux/slices/isFirstVisit';
import ContinueButton from '../ContinueButton';

import Feature, {featuredata} from './Feature';

import './styles.scss';

export default function Welcome() {
    const dispatch = useAppDispatch();

    return (
        <Box className="welcome-container">
            <Grid item xs={12} md={12}>
                <Typography className="welcome-title">
                    Panther Advanced Staking
                </Typography>
                <Typography className="welcome-message">
                    Staking is a centerpiece of the Panther Protocol. You can
                    use it for:
                </Typography>
            </Grid>

            <Grid item xs={12} md={12} className="features-holder">
                {featuredata.map((feature, index) => (
                    <Grid key={index} item xs={12} md={4}>
                        <Feature feature={feature} key={index} />
                    </Grid>
                ))}
            </Grid>

            <Grid item xs={12} md={12} className="continue-button-holder">
                <ContinueButton onClick={() => dispatch(registerFirstVisit)} />
            </Grid>
        </Box>
    );
}
