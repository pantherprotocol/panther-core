// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {fireEvent, screen, waitFor} from '@testing-library/react';
import {renderComponent} from 'components/common/test-utils';
import {MainPageWrapper} from 'components/MainPageWrapper';
import {BrowserRouter as Router} from 'react-router-dom';

import SignatureRequestModal from './index';

beforeAll(() => {
    global.fetch = global.mockGeoLocationRes();
});

test('should render', () => {
    renderComponent(<SignatureRequestModal />);

    const modalText = screen.getByText(
        /This signature is totally free and does not spend any gas/i,
    );

    waitFor(() => {
        expect(modalText).toBeTruthy();
    });
});

test('should not have isBlur className after clicking on close icon', async () => {
    const mainPageWrapperChild = screen.queryByTestId(
        'main-page-wrapper_main-page-wrapper_child',
    );

    renderComponent(
        <>
            <Router>
                <MainPageWrapper>{mainPageWrapperChild}</MainPageWrapper>
                <SignatureRequestModal />
            </Router>
            ,
        </>,
    );

    const mainPageWrapper = screen.queryByTestId(
        'main-page-wrapper_main-page-wrapper_container',
    );

    const modalContainer = screen.queryByTestId(
        'signature-request-modal_signature-request-modal_container',
    );
    const closeIcon = screen.queryByTestId(
        'signature-request-modal_signature-request-modal_close-icon',
    );

    await waitFor(() => {
        expect(modalContainer).toBeInTheDocument;
        expect(closeIcon).toBeInTheDocument;
        expect(mainPageWrapper).toBeInTheDocument();
    });

    await (closeIcon && fireEvent.click(closeIcon));

    await expect(mainPageWrapper).not.toHaveProperty('className', /isBlur/);
});
