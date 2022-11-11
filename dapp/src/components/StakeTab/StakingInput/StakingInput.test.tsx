import * as React from 'react';

import {screen} from '@testing-library/react';
import {renderComponent} from 'utils/test-utils';

import StakingInput from '.';

const stakingValue = '5';

test('should render', () => {
    renderComponent(<StakingInput amountToStake={stakingValue} />);
    const inputWrapper = screen.getByTestId('input-item');
    expect(inputWrapper).toBeInTheDocument();
    const input = (inputWrapper as HTMLDivElement).firstChild;
    expect((input as HTMLInputElement).value).toBe(stakingValue);
});
