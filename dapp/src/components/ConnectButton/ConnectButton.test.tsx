// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {fireEvent, screen, waitFor} from '@testing-library/react';
import {Web3ReactProvider} from '@web3-react/core';
import {getLibrary} from 'services/provider';
import {renderComponent} from 'utils/test-utils';

import ConnectButton from './index';

test('should render', async () => {
    renderComponent(<ConnectButton />);
    const connectButtonContainer = screen.queryByTestId(
        'common_primary-action-button_container',
    );
    await waitFor(() => expect(connectButtonContainer).toBeInTheDocument());
});

test('click on button should trigger onClick event', async () => {
    renderComponent(
        <Web3ReactProvider getLibrary={getLibrary}>
            <ConnectButton />
        </Web3ReactProvider>,
    );

    const connectButtonContainer = screen.queryByTestId(
        'common_primary-action-button_container',
    );
    const connectButtonTextSpan = screen.queryByTestId(
        'connect-button_connect-button_text',
    );

    await waitFor(() => {
        expect(connectButtonContainer).toBeInTheDocument(),
            expect(connectButtonTextSpan).toBeInTheDocument();
    });

    const connectButtonTextBeforeClick = await connectButtonTextSpan?.innerHTML;
    await waitFor(() => {
        expect(connectButtonTextBeforeClick).toBe('Connect Wallet');
    });

    await waitFor(
        () => connectButtonTextSpan && fireEvent.click(connectButtonTextSpan),
    );

    const connectButtonTextAfterClick = await connectButtonTextSpan?.innerHTML;
    await waitFor(() => {
        expect(connectButtonTextAfterClick).toBe('Install MetaMask');
    });
});
