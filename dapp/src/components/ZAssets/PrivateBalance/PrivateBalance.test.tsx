import * as React from 'react';

import {Box, Typography} from '@mui/material';
import {screen, waitFor} from '@testing-library/react';
import {formatCurrency} from 'lib/format';
import {safeParseUnits} from 'lib/numbers';
import {fiatPrice} from 'lib/tokenPrice';
import {renderComponent} from 'utils/test-utils';

import PrivateBalance from './index';

test('should render', async () => {
    renderComponent(<PrivateBalance />);
    const privateBalanceContainer = screen.queryByTestId(
        'ZAssets_private-balance_container',
    );
    await waitFor(() => expect(privateBalanceContainer).toBeInTheDocument());
});

test('should format Total Private zAsset Balance correctly', async () => {
    const zkpPrice = safeParseUnits('0.03766691');
    const unclaimedZZKP = safeParseUnits('100');
    const totalPrice = fiatPrice(unclaimedZZKP, zkpPrice);

    renderComponent(
        <Box className="private-zAssets-balance">
            <Typography className="title">
                Total Private zAsset Balance
            </Typography>
            <Typography className="amount">
                <span data-testid="ZAssets_private-balance_balance">
                    ${formatCurrency(totalPrice, {decimals: 2})}
                </span>
            </Typography>
        </Box>,
    );

    const privateBalanceBalanceElement = screen.queryByTestId(
        'ZAssets_private-balance_balance',
    );

    await waitFor(() => {
        expect(privateBalanceBalanceElement).toBeInTheDocument();
    });

    const privateBalanceBalanceValue =
        await privateBalanceBalanceElement?.innerHTML;

    await waitFor(() => {
        expect(privateBalanceBalanceValue).toBe('$3.76');
    });
});

test('should format Total Privacy Reward Points (PRP) correctly', async () => {
    const unclaimedPRP = safeParseUnits('0.00000000000001');

    renderComponent(
        <Box className="private-zAssets-balance">
            <Typography className="zkp-rewards">
                <span data-testid="ZAssets_private-balance_prp">
                    {unclaimedPRP
                        ? formatCurrency(unclaimedPRP, {scale: 0})
                        : '-'}{' '}
                </span>
                <span className="info">Total Privacy Reward Points (PRP)</span>
            </Typography>
        </Box>,
    );

    const totalPrivacyRewardPointsElement = screen.queryByTestId(
        'ZAssets_private-balance_prp',
    );

    await waitFor(() => {
        expect(totalPrivacyRewardPointsElement).toBeInTheDocument();
    });

    const totalPrivacyRewardPoints =
        await totalPrivacyRewardPointsElement?.innerHTML;

    await waitFor(() => {
        expect(totalPrivacyRewardPoints).toBe('10,000.00 ');
    });
});
