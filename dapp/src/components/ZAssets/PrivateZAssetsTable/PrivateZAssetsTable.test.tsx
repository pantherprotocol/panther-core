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

    const prpTooltip = `PRPs (Panther Reward Points). This additional reward, aimed
        toward incentivizing Advanced Staking, will also be created in the Shielded
        Pool as a calculation based on the number of $zZKP for a given user. Users
        will be able to convert PRPs to $zZKP using the Reward Converter when the core
        protocol (Panther Core V1) launches.`;

    renderComponent(<PrivateZAssetsTable />);

    const PrivateZAssetsTableContainer = screen.queryByTestId(
        'ZAssets_private-zassets-table_container',
    );

    const PrivateZAssetsTableZassetTooltip = screen.queryByTestId(
        'ZAssets_private-zassets-table_zasset-tooltip',
    );

    const PrivateZAssetsTablePrpTooltip = screen.queryByTestId(
        'ZAssets_private-zassets-table_prp-tooltip',
    );

    await waitFor(() => {
        expect(PrivateZAssetsTableContainer).toBeInTheDocument();
        expect(PrivateZAssetsTableZassetTooltip).toBeInTheDocument();
        expect(PrivateZAssetsTablePrpTooltip).toBeInTheDocument();
    });

    await waitFor(() => {
        expect(PrivateZAssetsTablePrpTooltip).toHaveAttribute(
            'aria-label',
            prpTooltip,
        );
        expect(PrivateZAssetsTableZassetTooltip).toHaveAttribute(
            'aria-label',
            zAssetTooltip,
        );
    });
});
