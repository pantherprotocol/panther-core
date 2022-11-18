import * as React from 'react';

import {screen} from '@testing-library/react';
import {renderComponent} from 'utils/test-utils';

import BalanceCard from '.';

test('should render', () => {
    renderComponent(<BalanceCard />);
    const inputWrapper = screen.getByTestId('balance-card_wrapper');
    expect(inputWrapper).toBeInTheDocument();
});
