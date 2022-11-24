// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {Box} from '@mui/material';
import {fireEvent, screen, waitFor} from '@testing-library/react';
import PrimaryActionButton from 'components/Common/PrimaryActionButton';
import {supportedNetworks} from 'services/connectors';
import {MASP_CHAIN_ID} from 'services/env';
import {renderComponent} from 'utils/test-utils';

import WrongZAssetsNetwork from './index';

jest.mock('../../../services/env', () => ({
    MASP_CHAIN_ID: 80001,
}));

it('is should render correctly', async () => {
    renderComponent(<WrongZAssetsNetwork />);

    const zAssetsWrongZassetsNetworkContainer = screen.queryByTestId(
        'ZAssets_WrongZassetsNetwork_container',
    );

    await waitFor(() =>
        expect(zAssetsWrongZassetsNetworkContainer).toBeInTheDocument(),
    );

    expect(supportedNetworks[MASP_CHAIN_ID!].name).toBe('Mumbai');
});

it('click on button should trigger onClick event', async () => {
    const clickHandler = jest.fn();

    renderComponent(
        <Box
            className="wrong-network-container"
            data-testid="ZAssets_WrongZassetsNetwork_container"
        >
            <Box className="switch-btn">
                <PrimaryActionButton onClick={clickHandler}>
                    Switch Network
                </PrimaryActionButton>
            </Box>
        </Box>,
    );

    const zAssetsWrongZassetsNetworkContainer = screen.queryByTestId(
        'ZAssets_WrongZassetsNetwork_container',
    );

    const zAssetsWrongZassetsNetworkButton = screen.queryByTestId(
        'common_primary-action-button_container',
    );

    await waitFor(() => {
        expect(zAssetsWrongZassetsNetworkContainer).toBeInTheDocument();
        expect(zAssetsWrongZassetsNetworkButton).toBeInTheDocument();
    });

    await (zAssetsWrongZassetsNetworkButton &&
        fireEvent.click(zAssetsWrongZassetsNetworkButton));

    waitFor(() => expect(clickHandler).toBeCalled());
});
