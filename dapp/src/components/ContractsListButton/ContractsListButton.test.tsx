// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {screen} from '@testing-library/react';
import {BrowserRouter as Router} from 'react-router-dom';
import {renderComponent} from 'utils/test-utils';

import {ContractsListButton} from '.';

test('should render', () => {
    renderComponent(
        <Router>
            <ContractsListButton />
        </Router>,
    );
    const inputWrapper = screen.getByTestId('contract-list-button_wrapper');
    expect(inputWrapper).toBeInTheDocument();
});
