// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {screen, waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {renderComponent} from 'utils/test-utils';

import UnstakingInfo from './UnstakingInfo';

import UnstakingTab from './index';

describe('UnstakingTab', () => {
    test('should render', async () => {
        renderComponent(
            <MemoryRouter>
                <UnstakingTab />
            </MemoryRouter>,
        );

        const unstakingTabContainer = screen.queryByTestId(
            'unstake-tab_unstaking-tab_container',
        );

        await waitFor(() => {
            expect(unstakingTabContainer).toBeInTheDocument();
        });
    });
});

describe('UnstakingInfo', () => {
    test('should render with correct content', async () => {
        renderComponent(
            <MemoryRouter>
                <UnstakingInfo />,
            </MemoryRouter>,
        );

        const unstakingInfoLink = screen.queryByTestId(
            'unstake-tab_unstaking-info_link',
        );

        const linkText = unstakingInfoLink?.textContent;

        await waitFor(() => {
            expect(unstakingInfoLink).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(linkText).toBe('zAsset page');
        });
    });
});
