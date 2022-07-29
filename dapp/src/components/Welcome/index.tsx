import React from 'react';

import {Box, Container, Grid, Typography} from '@mui/material';
import {Link} from 'react-router-dom';

import logoHighResolution from '../../images/logo-high-resolution.svg';
import {useAppDispatch} from '../../redux/hooks';
import {registerFirstVisit} from '../../redux/slices/isFirstVisit';
import {SafeLink} from '../Common/links';
import ContinueButton from '../ContinueButton';

import Feature, {featuredata} from './Feature';

import './styles.scss';

export default function Welcome() {
    const dispatch = useAppDispatch();

    return (
        <Container className="welcome-container">
            <Grid container className="welcome-holder">
                <Grid
                    item
                    container
                    spacing={2}
                    md={12}
                    xs={12}
                    className="high-resolution-logo"
                >
                    <Grid item xs={12} md={12}>
                        <Box>
                            <img
                                src={logoHighResolution}
                                alt="High resolution logo "
                            />
                        </Box>
                    </Grid>
                </Grid>
                <Grid item container spacing={2} md={12} xs={12}>
                    <Grid item xs={12} md={12}>
                        <Box>
                            <Typography className="welcome-title">
                                Welcome to Panther Staking!
                            </Typography>
                            <Typography className="welcome-message">
                                Classic Staking rewards on Ethereum and Polygon
                                have ended.
                            </Typography>
                            <Typography className="welcome-message">
                                However you can now test Advanced Staking
                                according to the dates shown below.
                            </Typography>

                            <Typography className="welcome-message">
                                <strong>To get test $ZKP</strong>, use the
                                <Link to={'/faucet'}>faucet</Link>
                            </Typography>
                            <Typography className="welcome-message">
                                <strong>
                                    To participate in testing and earn rewards
                                </strong>
                                , please report bugs using the following form:{' '}
                                <SafeLink href="https://bit.ly/3xI5rcN"></SafeLink>
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid
                        container
                        item
                        xs={12}
                        md={12}
                        className="features-holder"
                    >
                        {featuredata.map((feature, index) => (
                            <Grid key={index} item xs={12} md={4}>
                                <Feature feature={feature} />
                            </Grid>
                        ))}
                    </Grid>
                </Grid>
                <Grid
                    container
                    item
                    xs={12}
                    md={12}
                    className="continue-button-holder"
                >
                    <ContinueButton
                        onClick={() => dispatch(registerFirstVisit)}
                    />
                </Grid>
            </Grid>
        </Container>
    );
}
