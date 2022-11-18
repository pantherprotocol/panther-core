import * as React from 'react';

import {fireEvent, screen, waitFor} from '@testing-library/react';
import {renderComponent} from 'utils/test-utils';

import {LogoutButton} from './index';

test('should render', () => {
    renderComponent(<LogoutButton />);
    const logoutButton = screen.queryByTestId('logout-button_wrapper');
    waitFor(() => expect(logoutButton).toBeInTheDocument());
});

test('click on button should trigger onClick event', () => {
    const handleClick = jest.fn();
    renderComponent(<LogoutButton />);
    const logoutButton = screen.queryByTestId('logout-button_wrapper');
    waitFor(() => expect(logoutButton).toBeInTheDocument());
    logoutButton && fireEvent.click(logoutButton);
    waitFor(() => expect(handleClick).toBeCalled());
});
