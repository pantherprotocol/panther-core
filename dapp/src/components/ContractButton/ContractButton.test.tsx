import * as React from 'react';

import {screen} from '@testing-library/react';
import {renderComponent} from 'utils/test-utils';

import ContractButton from '.';

test('should render', () => {
    renderComponent(<ContractButton />);
    const inputWrapper = screen.getByTestId('contract-button_action-button');
    expect(inputWrapper).toBeInTheDocument();
});
