// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {screen, waitFor} from '@testing-library/react';
import {renderComponent} from 'components/common/test-utils';

import ClaimedProgress from './index';

test('should render', async () => {
    const testTotal = 1000;
    const testClaimed = 100;

    renderComponent(
        <ClaimedProgress total={testTotal} claimed={testClaimed} />,
    );
    const claimedProgressContainer = screen.queryByTestId(
        'claimed-progress_claimed-progress_container',
    );
    await waitFor(() => expect(claimedProgressContainer).toBeInTheDocument());
});

test('should format numbers correctly', async () => {
    const testTotal = 10000000;
    const testClaimed = 10000;

    renderComponent(
        <ClaimedProgress total={testTotal} claimed={testClaimed} />,
    );

    const claimedProgressContainer = screen.queryByTestId(
        'claimed-progress_claimed-progress_container',
    );

    const claimedProgressValueElement = screen.queryByTestId(
        'claimed-progress_claimed-progress_value',
    );

    await waitFor(() => {
        expect(claimedProgressContainer).toBeInTheDocument(),
            expect(claimedProgressValueElement).toBeInTheDocument();
    });

    const claimedProgressValue = await claimedProgressValueElement?.innerHTML;

    await waitFor(() => {
        expect(claimedProgressValue?.includes('10k / 10m')).toBeTruthy();
    });
});
