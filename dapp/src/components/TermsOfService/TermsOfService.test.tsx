// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {screen, waitFor} from '@testing-library/react';
import {renderComponent} from 'components/Common/test-utils';

import TermsOfService from './index';

test('should render with correct content', async () => {
    renderComponent(<TermsOfService />);
    const serviceTermsContainer = screen.queryByTestId(
        'terms-of-service_terms-of-service_container',
    );
    const serviceTermsContent = screen.queryByTestId(
        'terms-of-service_terms-of-service_content',
    );

    await waitFor(() => {
        expect(serviceTermsContainer).toBeInTheDocument();
        expect(serviceTermsContent).toBeInTheDocument();
    });

    const serviceTermsContentValue = await serviceTermsContent?.innerHTML;

    await waitFor(() => {
        expect(serviceTermsContentValue).toMatch(
            /Please read these Terms of Service/i,
        );
        expect(serviceTermsContentValue).toMatch(
            /PANTHER FURTHER EXPRESSLY DISCLAIMS ALL LIABILITY/i,
        );
    });
});
