// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {screen} from '@testing-library/react';
import {BrowserRouter as Router} from 'react-router-dom';
import {renderComponent} from 'utils/test-utils';

import Footer from './index';

test('should render footer', () => {
    renderComponent(
        <Router>
            <Footer />
        </Router>,
    );
    const footerComponent = screen.getByTestId('footer');
    expect(footerComponent).toBeInTheDocument();

    expect(screen.getByTestId('footer-social-links')).toBeInTheDocument();
    expect(screen.getByTestId('Terms')).toHaveTextContent('Terms');
});
