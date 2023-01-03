// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {fireEvent, screen, waitFor} from '@testing-library/react';
import {Web3ReactProvider} from '@web3-react/core';
import {renderComponent} from 'components/common/test-utils';
import {getLibrary} from 'services/provider';

import ZafariFaucet from './index';

test('should render with correct texts when wallet is disconnected', async () => {
    renderComponent(<ZafariFaucet />);

    const zafariFaucetContainer = screen.queryByTestId(
        'zafari-faucet_zafari-faucet_container',
    );

    const zafariFaucetNetwork = screen.queryByTestId(
        'zafari-faucet_zafari-faucet_network',
    );

    const zafariFaucetAddress = screen.queryByTestId(
        'zafari-faucet_zafari-faucet_address',
    );

    const zafariFaucetButtonHolder = screen.queryByTestId(
        'zafari-faucet_zafari-faucet_button-holder',
    );

    await waitFor(() => {
        expect(zafariFaucetContainer).toBeInTheDocument();
        expect(zafariFaucetNetwork).toBeInTheDocument();
        expect(zafariFaucetAddress).toBeInTheDocument();
        expect(zafariFaucetButtonHolder).toBeInTheDocument();
    });

    await waitFor(() => {
        expect(zafariFaucetNetwork?.textContent).toBe('Wallet not connected');
        expect(zafariFaucetAddress?.textContent).toBe('Wallet not connected');
        expect(zafariFaucetButtonHolder?.textContent).toBe('Connect Wallet');
    });
});

test('click on button should trigger onClick event', async () => {
    renderComponent(
        <Web3ReactProvider getLibrary={getLibrary}>
            <ZafariFaucet />
        </Web3ReactProvider>,
    );

    const zafariFaucetNetwork = screen.queryByTestId(
        'zafari-faucet_zafari-faucet_network',
    );

    const zafariFaucetAddress = screen.queryByTestId(
        'zafari-faucet_zafari-faucet_address',
    );

    const zafariFaucetButtonHolder = screen.queryByTestId(
        'zafari-faucet_zafari-faucet_button-holder',
    );

    const zafariFaucetConnectButton = screen.queryByRole('button', {
        name: /Connect Wallet/i,
    });

    await waitFor(() => {
        expect(zafariFaucetNetwork).toBeInTheDocument();
        expect(zafariFaucetAddress).toBeInTheDocument();
        expect(zafariFaucetButtonHolder).toBeInTheDocument();
        expect(zafariFaucetConnectButton).toBeInTheDocument();
    });

    await waitFor(
        () =>
            zafariFaucetConnectButton &&
            fireEvent.click(zafariFaucetConnectButton),
    );

    await waitFor(() => {
        expect(zafariFaucetButtonHolder?.textContent).toBe('Install MetaMask');
    });
});
