// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {screen, waitFor} from '@testing-library/react';
import {renderComponent} from 'utils/test-utils';

import PrivateZAssetsTable from './index';

test('should render', async () => {
    renderComponent(<PrivateZAssetsTable />);

    const PrivateZAssetsTableContainer = screen.queryByTestId(
        'ZAssets_private-zassets-table_container',
    );

    await waitFor(() =>
        expect(PrivateZAssetsTableContainer).toBeInTheDocument(),
    );
});

test('should show correct tooltip', async () => {
    const zAssetTooltip = `$zZKP in a MASP. This reward is calculated based on your
        Stake but created as a transaction in the MASP. You will be able to redeem $zZKP
        for $ZKP using the Withdraw option at the end of the Advanced Staking period.`;

    renderComponent(<PrivateZAssetsTable />);

    const PrivateZAssetsTableContainer = screen.queryByTestId(
        'ZAssets_private-zassets-table_container',
    );

    const PrivateZAssetsTableZassetTooltip = screen.queryByTestId(
        'ZAssets_private-zassets-table_zasset-tooltip',
    );

    await waitFor(() => {
        expect(PrivateZAssetsTableContainer).toBeInTheDocument();
        expect(PrivateZAssetsTableZassetTooltip).toBeInTheDocument();
    });

    await waitFor(() => {
        expect(PrivateZAssetsTableZassetTooltip).toHaveAttribute(
            'aria-label',
            zAssetTooltip,
        );
    });
});
