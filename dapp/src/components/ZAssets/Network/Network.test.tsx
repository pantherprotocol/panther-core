import * as React from 'react';

import {Box, Typography} from '@mui/material';
import {screen, waitFor} from '@testing-library/react';

import polygonIcon from '../../../images/polygon-beige-logo.svg';
import {renderComponent} from '../../../utils/test-utils';

import Network from './index';

test('should render', async () => {
    const testNetworkName = 'Polygon';

    renderComponent(<Network networkName={testNetworkName} />);
    const networkContainer = screen.queryByTestId('ZAssets_network_container');
    await waitFor(() => expect(networkContainer).toBeInTheDocument());

    const networkContainerText = await networkContainer?.innerHTML;

    await waitFor(() => {
        expect(networkContainerText).toBe('Not Connected');
    });
});

test('should display network name correctly', async () => {
    const testNetworkName = 'Polygon';

    renderComponent(
        <Box className="asset-network" data-testid="ZAssets_network_container">
            <Typography className="network-logo">
                <img src={polygonIcon} data-testid="ZAssets_network_logo" />
            </Typography>
            <Typography
                className="asset-name"
                data-testid="ZAssets_network_name"
            >
                {testNetworkName}
            </Typography>
        </Box>,
    );

    const networkContainer = screen.queryByTestId('ZAssets_network_container');
    const networkLogo = screen.queryByTestId('ZAssets_network_logo');
    const networkName = screen.queryByTestId('ZAssets_network_name');

    await waitFor(() => {
        expect(networkContainer).toBeInTheDocument(),
            expect(networkLogo).toBeInTheDocument(),
            expect(networkName).toBeInTheDocument();
    });

    const networkNameText = await networkName?.innerHTML;

    await waitFor(() => {
        expect(networkNameText).toBe('Polygon');
    });
});
