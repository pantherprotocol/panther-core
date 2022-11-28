// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {Box, Grid, Typography} from '@mui/material';
import {fireEvent, screen, waitFor} from '@testing-library/react';
import {Web3ReactProvider} from '@web3-react/core';
import {renderComponent} from 'components/Common/test-utils';
import ContinueButton from 'components/ContinueButton';
import {getLibrary} from 'services/provider';

import Feature, {featuredata} from './Feature';

import Welcome from './index';

test('should render with correct feature titles', async () => {
    const featureTitles: any = [];
    renderComponent(<Welcome />);
    const welcomeContainer = screen.queryByTestId('welcome_welcome_container');
    const welcomeFeatureContainer = screen.queryAllByTestId(
        'welcome_feature_container',
    );
    const welcomeFeatureTitle = screen.queryAllByTestId(
        'welcome_feature_title',
    );

    await waitFor(() => {
        expect(welcomeContainer).toBeInTheDocument();
        expect(welcomeFeatureContainer).toBeDefined();
    });

    welcomeFeatureTitle?.map(element => {
        featureTitles.push(element.textContent);
    });

    await waitFor(() => {
        expect(featureTitles.includes('Privacy')).toBeTruthy();
    });
});

test('click on button should trigger onClick event', async () => {
    const testClose = jest.fn();

    renderComponent(
        <Web3ReactProvider getLibrary={getLibrary}>
            <Box
                className="welcome-container"
                data-testid="welcome_welcome_container"
            >
                <Grid item xs={12} md={12}>
                    <Typography className="welcome-title">
                        Panther Advanced Staking
                    </Typography>
                    <Typography className="welcome-message">
                        Staking is a centerpiece of the Panther Protocol. You
                        can use it for:
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
                    <ContinueButton onClick={testClose} />
                </Grid>
            </Box>
        </Web3ReactProvider>,
    );

    const welcomeContainer = screen.queryByTestId('welcome_welcome_container');
    const welcomeButton = screen.queryByRole('button', {
        name: /Continue/i,
    });

    await waitFor(() => {
        expect(welcomeContainer).toBeInTheDocument();
        expect(welcomeButton).toBeInTheDocument();
    });

    await waitFor(() => welcomeButton && fireEvent.click(welcomeButton));

    await waitFor(() => {
        expect(testClose).toHaveBeenCalledTimes(1);
    });
});
