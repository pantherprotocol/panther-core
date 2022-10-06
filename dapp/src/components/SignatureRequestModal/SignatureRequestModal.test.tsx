import * as React from 'react';

import {fireEvent, screen, waitFor} from '@testing-library/react';
import {BrowserRouter as Router} from 'react-router-dom';

import {MainPageWrapper} from '../../components/MainPageWrapper';
import {renderComponent} from '../../utils/test-utils';

import SignatureRequestModal from './index';

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
