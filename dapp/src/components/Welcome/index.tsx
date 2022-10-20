import React from 'react';

import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import {Box, Grid, Typography} from '@mui/material';
import Carousel from 'react-material-ui-carousel';

import {useAppDispatch} from '../../redux/hooks';
import {acknowledgeNotification} from '../../redux/slices/acknowledgedNotifications';
import ContinueButton from '../ContinueButton';

import Feature, {featuredata} from './Feature';

import './styles.scss';

const FeaturedDataComponents = featuredata.map((feature, index) => (
    <Grid key={index} item xs={12} md={4}>
        <Feature feature={feature} key={index} />
    </Grid>
));

export default function Welcome() {
    const dispatch = useAppDispatch();

    return (
        <Box
            className="welcome-container"
            data-testid="welcome_welcome_container"
        >
            <Grid item xs={12} md={12}>
                <Typography className="welcome-title">
                    Panther Advanced Staking
                </Typography>
                <Typography className="welcome-message">
                    Staking is a centerpiece of the Panther Protocol. You can
                    use it for:
                </Typography>
            </Grid>

            {/* Only visible after medium screen size */}
            <Grid
                item
                xs={12}
                md={12}
                className="features-holder welcome_slide--invisible"
            >
                {FeaturedDataComponents}
            </Grid>

            {/* Only visible before medium screen size */}
            <Grid
                item
                xs={12}
                md={12}
                className="features-holder welcome_slide--visible"
            >
                <Carousel
                    fullHeightHover={false}
                    navButtonsAlwaysVisible={true}
                    autoPlay={false}
                    NextIcon={<ArrowForwardOutlinedIcon />} // Change the "inside" of the next button to "next"
                    PrevIcon={<ArrowBackOutlinedIcon />}
                >
                    {FeaturedDataComponents}
                </Carousel>
            </Grid>

            <Grid item xs={12} md={12} className="continue-button-holder">
                <ContinueButton
                    onClick={() =>
                        dispatch(acknowledgeNotification, 'notFirstVisit')
                    }
                />
            </Grid>
        </Box>
    );
}
