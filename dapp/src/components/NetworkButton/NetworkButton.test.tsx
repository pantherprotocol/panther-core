// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import '@testing-library/jest-dom';
import {fireEvent, screen, waitFor} from '@testing-library/react';
import maticIcon from 'images/polygon-logo.svg';
import {renderComponent} from 'utils/test-utils';

import NetworkButton from './index';

const testNetworkName = 'MATIC';

test('should render', () => {
    renderComponent(
        <NetworkButton networkLogo={maticIcon} networkName={testNetworkName} />,
    );
    const networkButtonComponent = screen.queryByTestId(
        'network-button_network-button_container',
    );
    const networkButtonLogo = screen.queryByTestId(
        'network-button_network-button_select-logo',
    );
    const networkButtonSelectLabel = screen.queryByTestId(
        'network-button_network-button_select-label',
    );

    waitFor(() => {
        expect(networkButtonComponent).toBeInTheDocument();
        expect(networkButtonLogo).toBeInTheDocument();
        expect(networkButtonSelectLabel).toBeInTheDocument();
    });
});

test('should allow user to change network', async () => {
    renderComponent(
        <NetworkButton networkLogo={maticIcon} networkName={testNetworkName} />,
    );

    const networkButtonSelectLogo = screen.queryByTestId(
        'network-button_network-button_select-logo',
    );

    const networkButtonSelectOption = screen.queryByTestId(
        'network-button_network-button_select-option',
    );

    await waitFor(() => {
        expect(networkButtonSelectLogo).toBeInTheDocument();
        expect(networkButtonSelectOption).toBeNull();
    });

    await (networkButtonSelectLogo && fireEvent.click(networkButtonSelectLogo));

    waitFor(() => {
        networkButtonSelectOption &&
            expect(networkButtonSelectOption).toBeInTheDocument();
    });
});
