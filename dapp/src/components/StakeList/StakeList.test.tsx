// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {screen, waitFor} from '@testing-library/react';
import {renderComponent} from 'components/common/test-utils';

import StakeList from './index';

test('should render with its child components', () => {
    renderComponent(<StakeList />);
    const stakeList = screen.queryByTestId('stake-list_stake-list_container');
    const unstakeButton = screen.queryByTestId(
        'stake-list_stake-button_container',
    );

    waitFor(() => {
        expect(stakeList).toBeInTheDocument();
        expect(unstakeButton).toBeInTheDocument();
    });

    const unstakeButtonTexts = ['Unstake', 'Locked Until:'];
    const buttonText = unstakeButton && unstakeButton.innerHTML;

    waitFor(() => {
        expect(unstakeButtonTexts).toContain(buttonText);
    });
});
