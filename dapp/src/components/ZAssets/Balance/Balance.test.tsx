import * as React from 'react';

import {screen, waitFor} from '@testing-library/react';
import {renderComponent} from 'utils/test-utils';

import Balance from './index';

const balance = '20';
const balanceValue = '20';
const name = 'Balance of ZKP';

test('should render and check correct value is in balance', () => {
    renderComponent(
        <Balance balance={balance} balanceValue={balanceValue} name={name} />,
    );
    const balanceNetwork = screen.queryByTestId('zasseet-balance');
    waitFor(() => expect(balanceNetwork).toBeInTheDocument());

    const bValue = screen.queryByTestId('zasseet-balance-value');
    waitFor(() => expect(bValue).toHaveTextContent(balanceValue));
});
