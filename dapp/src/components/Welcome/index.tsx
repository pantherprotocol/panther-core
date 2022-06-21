import React from 'react';

import {Box, Container, Grid, Typography} from '@mui/material';

import logoHighResolution from '../../images/logo-high-resolution.svg';
import {useAppDispatch} from '../../redux/hooks';
import {registerFirstVisit} from '../../redux/slices/isFirstVisit';
import {SafeLink} from '../Common/links';
import {ConnectButton} from '../ConnectButton';

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
                                Welcome to Advanced Staking (Testnet).
                            </Typography>
                            <Typography className="welcome-message">
                                Classic Staking rewards have ended.
                            </Typography>
                            <Typography className="welcome-message">
                                Welcome to Panther’s Advanced Staking.
                            </Typography>
                            <Typography className="welcome-message">
                                You can see the dates for testing in your
                                dashboard.
                            </Typography>
                            <Typography className="welcome-message">
                                Test $ZKP faucet:{' '}
                                <SafeLink href="https://faucet.pantherprotocol.io">
                                    faucet.pantherprotocol.io
                                </SafeLink>{' '}
                            </Typography>
                            <Typography className="welcome-message">
                                Test feedback form:{' '}
                                <SafeLink href=" https://docs.google.com/forms/d/e/1FAIpQLSftCbVmbosspDfFDLMwL5qfDyq4O7bRcijicZKPXLBhISUTGA/viewform">
                                    https://bit.ly/3xI5rcN
                                </SafeLink>
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
                    <ConnectButton
                        text={'Continue'}
                        onClick={() => dispatch(registerFirstVisit)}
                    />
                </Grid>
            </Grid>
        </Container>
    );
}
