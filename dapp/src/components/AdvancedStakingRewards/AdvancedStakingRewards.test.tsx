// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {screen, waitFor} from '@testing-library/react';
import StakingAPR from 'components/StakingAPR';
import {renderComponent} from 'utils/test-utils';

import AdvancedStakingRewards from './index';

test('should render', async () => {
    renderComponent(<AdvancedStakingRewards />);

    const advancedStakingRewardsContainer = screen.queryByTestId(
        'advanced-staking-rewards_advanced-staking-rewards_container',
    );
    const remainingDaysContainer = screen.queryByTestId(
        'advanced-staking-rewards_remaining-days_container',
    );

    await waitFor(() => {
        expect(advancedStakingRewardsContainer).toBeInTheDocument();
        expect(remainingDaysContainer).toBeInTheDocument();
    });
});

test('should format APR correctly', async () => {
    const testAPY = 40;

    renderComponent(<StakingAPR advancedStakingAPY={testAPY} />);

    const stakingAprContainer = screen.queryByTestId(
        'advanced-staking-rewards_staking-apr_container',
    );

    const stakingAprValueElement = screen.queryByTestId(
        'advanced-staking-rewards_staking-apr_value',
    );

    await waitFor(() => {
        expect(stakingAprContainer).toBeInTheDocument();
        expect(stakingAprValueElement).toBeInTheDocument();
    });

    const stakingAprValue = await stakingAprValueElement?.innerHTML;

    await waitFor(() => {
        expect(stakingAprValue).toBe('40.00%');
    });
});
