import * as React from 'react';

import {fireEvent, screen, waitFor} from '@testing-library/react';

import {renderComponent} from '../../utils/test-utils';

import {AddTokenButton} from './index';

test('should render', () => {
    renderComponent(<AddTokenButton />);
    const addZKPTokenButton = screen.queryByTestId(
        'add-token-button_add-token-button_wrapper',
    );
    waitFor(() => expect(addZKPTokenButton).toBeInTheDocument());
});

test('click on button should trigger onClick event', () => {
    const handleClick = jest.fn();
    renderComponent(<AddTokenButton />);
    const addZKPTokenButton = screen.queryByTestId(
        'add-token-button_add-token-button_wrapper',
    );
    waitFor(() => expect(addZKPTokenButton).toBeInTheDocument());
    addZKPTokenButton && fireEvent.click(addZKPTokenButton);
    waitFor(() => expect(handleClick).toBeCalled());
});
