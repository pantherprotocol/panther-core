import * as React from 'react';

import {fireEvent, screen, waitFor} from '@testing-library/react';

import {renderComponent} from '../../utils/test-utils';

import SwitchNetworkButton from './index';

test('should render', () => {
    renderComponent(<SwitchNetworkButton />);
    const switchNetworkButtonComponent = screen.queryByTestId(
        'switch-network-button_container',
    );
    waitFor(() => expect(switchNetworkButtonComponent).toBeInTheDocument());
});

test('click on button should trigger onClick event', () => {
    const defaultNetworkChainId = 80001;
    renderComponent(
        <SwitchNetworkButton defaultNetwork={defaultNetworkChainId} />,
    );
    const switchNetworkButtonComponent = screen.queryByTestId(
        'switch-network-button_container',
    );
    switchNetworkButtonComponent &&
        fireEvent.click(switchNetworkButtonComponent);
    waitFor(() => expect(switchNetworkButtonComponent).not.toBeVisible());
});
