// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {screen} from '@testing-library/react';
import {renderComponent} from 'components/Common/test-utils';

import StakingUnstakingCard from './index';

test('should render', () => {
    renderComponent(<StakingUnstakingCard />);
    const smallButton = screen.getByTestId('staking-unstaking-card_wrapper');
    expect(smallButton).toBeInTheDocument();
});
