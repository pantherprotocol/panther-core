// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {screen, waitFor} from '@testing-library/react';
import {renderComponent} from 'components/common/test-utils';
import {BrowserRouter as Router} from 'react-router-dom';

import {MainPageWrapper} from './index';

beforeAll(() => {
    global.fetch = global.mockGeoLocationRes();
});

test('should render the MainPageWrapper with its child element', async () => {
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
        expect(global.fetch).not.toBeCalled();
    });
});
