// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {screen} from '@testing-library/react';
import {renderComponent} from 'components/common/test-utils';

import {ConnectButtonModal} from './index';

const ConnectButtonModalURL = 'https://google.com';
const ConnectButtonModalName = 'test name';

test('should render', () => {
    renderComponent(
        <ConnectButtonModal
            url={ConnectButtonModalURL}
            name={ConnectButtonModalName}
        />,
    );
    const buttonHolder = screen.getByTestId(
        'connect-button-modal_holder-button',
    );
    expect(buttonHolder).toBeInTheDocument();
    const buttonLinkTag = screen.getByTestId('connect-button-modal_anchor-tag');
    const buttonText = buttonLinkTag.innerHTML;
    expect(buttonText).toEqual(ConnectButtonModalName);
    expect(buttonLinkTag).toHaveAttribute('href', ConnectButtonModalURL);
});
