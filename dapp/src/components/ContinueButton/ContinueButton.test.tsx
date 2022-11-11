import * as React from 'react';

import {fireEvent, screen, waitFor} from '@testing-library/react';
import {renderComponent} from 'utils/test-utils';

import ContinueButton from './index';

test('should render', () => {
    const handleClick = jest.fn();

    renderComponent(<ContinueButton onClick={handleClick} />);
    const continueButton = screen.queryByTestId(
        'continue-button_continue-button_wrapper',
    );

    waitFor(() => expect(continueButton).toBeInTheDocument());
});

test('click on button should trigger onClick event', () => {
    const handleClick = jest.fn();

    renderComponent(<ContinueButton onClick={handleClick} />);
    const continueButton = screen.getByText('Continue');
    fireEvent.click(continueButton);

    expect(handleClick).toBeCalled();
});
