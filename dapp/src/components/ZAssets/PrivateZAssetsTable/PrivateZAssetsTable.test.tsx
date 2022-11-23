import * as React from 'react';

import {screen, waitFor} from '@testing-library/react';
import {zAssetTooltip} from 'components/Common/constants';
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
