// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {screen} from '@testing-library/react';
import {renderComponent} from 'components/Common/test-utils';

import ContractButton from '.';

test('should render', () => {
    renderComponent(<ContractButton />);
    const inputWrapper = screen.getByTestId('contract-button_action-button');
    expect(inputWrapper).toBeInTheDocument();
});
