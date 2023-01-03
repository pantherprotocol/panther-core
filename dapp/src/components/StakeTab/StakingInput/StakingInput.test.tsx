// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: Copyright 2021-22 Panther Ventures Limited Gibraltar

import * as React from 'react';

import {screen} from '@testing-library/react';
import {renderComponent} from 'components/common/test-utils';

import StakingInput from '.';

const stakingValue = '5';

test('should render', () => {
    renderComponent(<StakingInput amountToStake={stakingValue} />);
    const inputWrapper = screen.getByTestId('input-item');
    expect(inputWrapper).toBeInTheDocument();
    const input = (inputWrapper as HTMLDivElement).firstChild;
    expect((input as HTMLInputElement).value).toBe(stakingValue);
});
