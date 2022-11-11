import * as React from 'react';

import {screen} from '@testing-library/react';
import {renderComponent} from 'utils/test-utils';

import StakingUnstakingCard from './index';

test('should render', () => {
    renderComponent(<StakingUnstakingCard />);
    const smallButton = screen.getByTestId('staking-unstaking-card_wrapper');
    expect(smallButton).toBeInTheDocument();
});
