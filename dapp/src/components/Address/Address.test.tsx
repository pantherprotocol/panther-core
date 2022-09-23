import * as React from 'react';

import {screen, waitFor} from '@testing-library/react';

import {renderComponent} from '../../utils/test-utils';

import Address from './index';

test('should render', () => {
    renderComponent(<Address />);
    const addressComponent = screen.queryByTestId('address-component');
    const userAvatar = screen.queryByTestId('jazz-icon');
    const walletAddress = screen.queryByTestId('wallet-address-test-id');
    waitFor(() => {
        expect(addressComponent).toBeInTheDocument();
        expect(userAvatar).toBeInTheDocument();
        expect(walletAddress).toBeInTheDocument();
    });
});

test('address should be formatted correctly', () => {
    renderComponent(<Address />);
    const walletAddress = screen.queryByTestId('wallet-address-test-id');
    waitFor(() => {
        expect(walletAddress).toMatch(/(...)/i);
    });
});
