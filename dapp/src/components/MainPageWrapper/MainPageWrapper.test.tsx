// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {screen, waitFor} from '@testing-library/react';
import {renderComponent} from 'components/Common/test-utils';
import {BrowserRouter as Router} from 'react-router-dom';

import {MainPageWrapper} from './index';

test('should render the MainPageWrapper with its child element', () => {
    const mainPageWrapper = screen.queryByTestId(
        'main-page-wrapper_main-page-wrapper_container',
    );
    const mainPageWrapperChild = screen.queryByTestId(
        'main-page-wrapper_main-page-wrapper_child',
    );
    renderComponent(
        <Router>
            <MainPageWrapper>{mainPageWrapperChild}</MainPageWrapper>
        </Router>,
    );

    waitFor(() => {
        expect(mainPageWrapperChild).toBeInTheDocument();
        expect(mainPageWrapper).toContainElement(mainPageWrapperChild);
    });
});
