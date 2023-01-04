// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {fireEvent, screen, waitFor} from '@testing-library/react';
import {renderComponent} from 'components/common/test-utils';

import SwitchNetworkButton from './index';

test('should render', () => {
    const onChange = jest.fn();
    renderComponent(<SwitchNetworkButton onChange={onChange} />);
    const switchNetworkButtonComponent = screen.queryByTestId(
        'switch-network-button_container',
    );
    waitFor(() => expect(switchNetworkButtonComponent).toBeInTheDocument());
});

test('click on button should trigger onClick event', () => {
    const defaultNetworkChainId = 80001;
    const onChange = jest.fn();
    renderComponent(
        <SwitchNetworkButton
            defaultNetwork={defaultNetworkChainId}
            onChange={onChange}
        />,
    );
    const switchNetworkButtonComponent = screen.queryByTestId(
        'switch-network-button_container',
    );
    switchNetworkButtonComponent &&
        fireEvent.click(switchNetworkButtonComponent);
    waitFor(() => expect(switchNetworkButtonComponent).not.toBeVisible());
});
